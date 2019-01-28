const db = require('../db');
const express = require('express');
const router = express.Router();
const config = require('../config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => { 
    db.selectByEmail(req.body.email, async (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found.');
        const passwordIsValid = bcrypt.compareSync(req.body.password, user.user_pass);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        const permissions = await db.selectGroup(user.user_group);
        const token = jwt.sign(
            { 
                id: user.id, 
                admin: user.is_admin, 
                group: user.user_group,
                change: permissions.change,
                remove: permissions.remove,
                upload: permissions.upload,
                download: permissions.download
            }, 
            config.secret, 
            { expiresIn: 3600 } // expires in 5 minutes
        );
        res.status(200).send(
            { 
                auth: true, 
                token: token, 
                is_admin: user.is_admin,
                permissions: {
                    role: user.is_admin === 1 ? 'SuperAdmin' : 'User',
                    read: permissions.change === 1 ? 'Allow' : 'Deny',
                    delete: permissions.remove === 1 ? 'Allow' : 'Deny',
                    upload: permissions.upload === 1 ? 'Allow' : 'Deny',
                    download: permissions.download === 1 ? 'Allow' : 'Deny'
                }
            }
        );
    });
});

function checkIsAdmin(req, res, next) {
    jwt.verify(req.headers.auth, config.secret, function(err, decoded) {
        if (err) return res.status(401).send(err);
        if (decoded.admin !== 1) {
            res.status(403).send(err);
        } else {
            next();
        }
    });
}

function getAbility(req, res, next) {
    jwt.verify(req.headers.auth, config.secret, function(err, decoded) {
        if (err) return res.status(401).send(err);
        req.decoded = decoded;
        next();
    });
}

router.get('/ability', getAbility, (req, res) => {
    res.status(200).send({
        role: req.decoded.admin === 1 ? 'SuperAdmin' : 'User',
        read: req.decoded.change === 1 ? 'Allow' : 'Deny',
        delete: req.decoded.remove === 1 ? 'Allow' : 'Deny',
        upload: req.decoded.upload === 1 ? 'Allow' : 'Deny',
        download: req.decoded.download === 1 ? 'Allow' : 'Deny'
    });
});

router.post('/register', checkIsAdmin, (req, res) => {
    db.insertUser([
        req.body.name,
        req.body.email,
        req.body.group,
        bcrypt.hashSync(req.body.password, 8),
        req.body.is_admin
    ],
    err => {
        if (err) return res.status(500).send("There was a problem registering the user.");
        res.status(200).send({});
    }); 
});

router.get('/groups', checkIsAdmin, (req, res) => {
    db.selectGroups((err, groups) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!groups) return res.status(404).send('No groups found.');
        res.status(200).send(groups);
    });
});

router.get('/users', checkIsAdmin, (req, res) => {
    db.selectUsers((err, users) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!users) return res.status(404).send('No users found.');
        res.status(200).send(users);
    });
});

router.post('/update-user', checkIsAdmin, (req, res) => {
    db.updateUser([
        req.body.name,
        req.body.group,
        req.body.email
    ], (err) => {
        if (err) return res.status(500).send('Error on the server.');
        res.status(200).send(err);
    });
});

router.post('/set-user-pass', checkIsAdmin, (req, res) => {
    db.changePass([
        bcrypt.hashSync(req.body.password, 8),
        req.body.email
    ], (err) => {
        if (err) return res.status(500).send('Error on the server.');
        res.status(200).send(err);
    });
});

router.delete('/user/:email', checkIsAdmin, (req, res) => {
    db.removeUser(req.params.email, (err) => {
        if (err) return res.status(500).send('Error on the server.');
        res.status(200).send(err);
    });
});

router.get('/folder-permission/:id', checkIsAdmin, async(req, res) => {
    try {
        const row = await db.selectPermission(req.params.id);
        //if (!rows) return res.status(404).send('No groups found.');
        res.status(200).send(row);
    } catch (e) {
        return res.status(500).send('Error on the server.');
    }
});

router.post('/folder-permission', checkIsAdmin, (req, res) => {
    db.updatePermission([
        req.body.data.permission,
        req.body.data.id
    ], (err, rows) => {
        if (err) return res.status(500).send('Error on the server.');
        //if (!rows) return res.status(404).send('No groups found.');
        res.status(200).send(rows);
    });
});

module.exports = { 
    user: router,
    jwt: jwt
}