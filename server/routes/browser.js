const express = require('express');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const router = express.Router();
const login = require('./user');
const promisify = require('util').promisify;
const config = require('../config');
const multer = require('multer');
const db = require('../db');
const ROOT_PATH = config.path;

const fsStat = promisify(fs.stat);
const readDir = promisify(fs.readdir);
const renameFile = promisify(fs.rename);
const createDir = promisify(mkdirp);
const fsUnlink = promisify(fs.unlink);
const fsRemoveDir = promisify(fs.rmdir);

async function deleteFiles(path, type) {
    if (type === 'file') {
        await fsUnlink(path);
    } else if (type === 'folder') {
        await fsRemoveDir(path);    
    }
}

router.use((req, res, next) => {
    login.jwt.verify(
        req.headers.auth, 
        config.secret, 
        (err, decoded) => {
            if (err) return res.status(401).send(err);
            req.decoded = decoded;
            next();
    });
});

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const url = repDelimiter(req.params.path);
        cb(null, ROOT_PATH + url);
    },
    async filename(req, file, cb) {
        cb(null, file.originalname);
        const id = 
            await db.insertTreeItem(file.originalname, req.body.id);
        await db.insertPermission(id,'[]');
    }
});

const upload = multer({
    storage: storage,
    async fileFilter(req, file, cb) {
        try {
            const isPermitted = 
                await checkFolderPermissions(
                    req.body.id,
                    req.decoded.group, 
                    'write') && 
                await checkFolderPermissions(
                    req.body.id,
                    req.decoded.group, 
                    'read');
            if (!isPermitted) return cb(null, false);
        } catch(e) {
            return cb(null, false);
        }
        cb(null, true);
    }
});

function checkPermissions(req, res, next) {
    const decoded = req.decoded;
    if ((decoded.change === 1 && (/^\/create-folder\//.test(req.path) || 
        /^\/paste\//.test(req.path) || /^\/rename\//.test(req.path) )) ||
        (decoded.remove === 1 && /^\/delete\//.test(req.path)) ||
        (decoded.upload === 1 && /^\/upload\//.test(req.path)) ||
        (decoded.download === 1 && /^\/download\//.test(req.path))) {
        next();
    } else {
        return res.status(403).send({});
    }
}

async function checkFolderPermissions(
    tree_id, 
    group, 
    operation
) {
    const row = await db.selectPermission(tree_id);
    if (row) {
        try {
            const permissions = JSON.parse(row.permissions);
            if (permissions.length) { 
                const result = permissions.filter(obj => {
                    return obj.name === group
                });
                return result[0][operation] === 1;
            } else {
                return true;
            }
        } catch(e) {
            console.log(e);
        }
    } else {  
        return true;
    }
}

async function readPermission(req, res, next) {
    try {
        const isPermitted = 
            await checkFolderPermissions(
                req.body.data.id,
                req.decoded.group, 
                'read'
            );
        if (!isPermitted) return res.status(403).send({});
        next();
    } catch(e) { console.log(e);
        res.status(500).send({});
    }
}

async function writePermission(req, res, next) {
    try {
        const isPermitted = 
            await checkFolderPermissions(
                req.body.data.id,
                req.decoded.group, 
                'write'
            ); 
        if (!isPermitted) return res.status(403).send({});
        next();
    } catch(e) {
        res.status(500).send({});
    } 
}

async function checkFolderStruct(dir, parent = 'null') {
    const folders = await readDir(dir);
    
    for (folder of folders) { 
        const folderPath = path.join(dir, folder);
        const stat = await fsStat(folderPath);
        let val = await db.insertTreeItem(folder, parent);

        if (val === 0) { // 0 - already inserted
            val = (await db.getTreeItem(folder, parent)).id;
        }

        await db.insertPermission(val, '[]');

        if (stat.isDirectory()) { 
            await checkFolderStruct(folderPath, val);       
        }
    }
}

(async () => {
    await checkFolderStruct(ROOT_PATH + '/');
})();

// db.getAllFolders((e, rows) => {
//     console.log(rows);
// })

// db.getAllPermissions((e, rows) => {
//     console.log(rows);
// })

async function getFileList(dir, parent) { 

    const fileList = [];
    const files = await readDir(dir);
  
    for (file of files) {
        const stat = await fsStat(path.join(dir, file));
        try {
            const fileInfo = await db.getTreeItem(file, parent);
            const item = { 
                id: fileInfo.id,
                name: file,
                type: stat.isDirectory() ? 'folder' : 'file',
                parentId: fileInfo.parent
            };
            fileList.push(item);
        } catch(e) {
            console.log(e);
            console.log('File exists but not found in db');
        }
        
    }
    return fileList;
}

async function getFolderStruct(
    dir, 
    group, 
    folderList = [], 
    parent = 'null'
) {

    const folders = await readDir(dir);
  
    for (folder of folders) { 
        const folderPath = path.join(dir, folder);
        const stat = await fsStat(folderPath);

        const folderInfo = await db.getTreeItem(folder, parent);
        const folderId = folderInfo.id;

        if (stat.isDirectory()) {
            const item = {
                id: folderInfo.id,
                name: folder, 
                parentId : folderInfo.parent 
            };

            folderList.push(item);
            item.children = [];

            try {
                const isPermitted = 
                            await checkFolderPermissions(
                                    folderId, 
                                    group, 
                                    'read'
                            );                                            
                if (isPermitted) {
                    await getFolderStruct(
                            folderPath, 
                            group, 
                            item.children, 
                            folderId
                    );
                }
            } catch(e) {
                //res.status(403).send({});
                console.log(e);
            }
        }
    }
    return folderList;
}

router.get('/struct', (req, res) => {
    getFolderStruct(ROOT_PATH + '/', req.decoded.group)
    .then(result => {
        res.status(200).send(result);
    });
});

router.post(
    '/content/:path?', 
    readPermission, 
    async (req, res) => {
        const url = repDelimiter(req.params.path);
        getFileList(ROOT_PATH + url, req.body.data.id)
        .then(
            result => {
                res.status(200).send(result);
            },
            err => {
                res.status(404).send(err);
        });
});

router.post(
    '/create-folder/:path?', 
    checkPermissions,
    readPermission,
    writePermission,
    (req, res) => {
        const url = repDelimiter(req.params.path);
        createDir(ROOT_PATH + url)
        .then(
            async result => {
                const id = 
                    await db.insertTreeItem(
                        req.body.data.name, 
                        req.body.data.id
                    );
                await db.insertPermission(id, '[]');
                res.status(200).send(result);
            }, 
            err => {
                res.status(500).send(result);
        });
});

router.post(
    '/delete/:path?',
    checkPermissions,
    readPermission,
    async (req, res) => {

        const url = repDelimiter(req.params.path);

        let promises = [];

        for (let item of req.body.data.items) {
            try {
                const isPermitted = 
                    await checkFolderPermissions(
                        item.id,
                        req.decoded.group, 
                        'read'
                    );

                if (!isPermitted) {
                    throw new Error('Not permitted');
                }

                const fn = deleteFiles(ROOT_PATH + url + '/' + item.name, item.type)
                .then(
                    async result => {
                        try {
                            await db.removeItem([item.name, item.parentId]);
                            await db.removePermission(item.id);
                        } catch(e) {
                            return false;
                        }
                });

                promises.push(fn);
                
            } catch(e) {
                promises = [];
                res.status(403).send({});
                break;
            }
        }

        if (promises.length) {
            Promise.all(promises)
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((e) => {
                res.status(500).send(e);
            })
        }
});

router.post(
    '/paste/:path?', 
    checkPermissions,
    readPermission,
    writePermission,
    async (req, res) => {
        const data = req.body.data.clipboard;
        const sourceURL = repDelimiter(data.url);
        const destURL = repDelimiter(req.params.path);
        const promises = [];
        //TODO: Check if destination file exists
        for (let item of data.files) {
            try {
                const isPermitted = 
                    await checkFolderPermissions(
                            item.id,
                            req.decoded.group, 
                            'read');
                if (!isPermitted) return false;

                const source = ROOT_PATH + sourceURL + '/';
                const dest = ROOT_PATH + destURL + '/';

                if (dest === source) item.name = item.name.replace(/\.([^\.]*)$/, '_copy.$1');

                const fn = fs.copyFile(
                    source + item.name, 
                    dest + item.name,
                    async err => {
                        if (err) return;
                    
                        const id = 
                                await db.insertTreeItem(item.name, req.body.data.id);
                        await db.insertPermission(id,'[]');
                });

                promises.push(fn);
                
            } catch(e) {
                promises = [];
                res.status(403).send({});
                break;
            }
        }

        if (promises.length) {
            Promise.all(promises)
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((e) => {
                res.status(500).send(e);
            })
        }
});

router.post(
    '/rename/:from/:to',
    checkPermissions,
    writePermission, 
    (req, res) => {
        const from = repDelimiter(req.params.from), //generate full path to file
            to = repDelimiter(req.params.to);

        renameFile(ROOT_PATH + from, ROOT_PATH + to)
        .then(result => {
            //TODO: in future make files access checking like for folders
            //be careful - id is a parent id
            db.renameItem([req.body.data.to, req.body.data.from, req.body.data.id], 
                () => {
                    res.status(200).send(result);
            });
        });
});

router.post(
    '/upload/:path?', 
    checkPermissions,
    upload.fields([{ name: 'files', maxCount: 100 }]), 
    (req, res) => {
        res.status(200).send(true); 
    }
);

router.post(
    '/download/:path?', 
    checkPermissions,
    readPermission,
    (req, res) => {
        const url = repDelimiter(req.params.path);
        res.download(ROOT_PATH + url, 
            err => {
            //console.log(err);
        });
});

function repDelimiter(str) {
    return typeof str !== 'undefined' ? str.replace(/\*/g, '/') : '';
}

module.exports = router;