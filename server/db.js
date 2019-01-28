'use strict';

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

class Db {
    constructor(file) {
        this.db = new sqlite3.Database(file);
        this.createTable();
    }

    getAsync(sql, data) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.db.get(sql,
                data,
                (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row);
            });
        });
    }

    runAsync(sql, data) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.db.run(sql,
                data,
                function (err, row) {
                    if (err) 
                        reject(err);
                    else
                        resolve(this.lastID);
            });
        });
    }

    createTable() {
        const users = `
            CREATE TABLE IF NOT EXISTS users (
                id integer PRIMARY KEY, 
                name text, 
                email text UNIQUE, 
                user_pass text,
                user_group text,
                is_admin integer)`;

        const groups = `
            CREATE TABLE IF NOT EXISTS groups (
                id integer PRIMARY KEY,
                name text UNIQUE,
                change integer,
                remove integer,
                download integer,
                upload integer,
                permission integer)`;

        const tree = `
            CREATE TABLE IF NOT EXISTS tree (
                id integer PRIMARY KEY,
                name text,
                parent integer NULL,
                UNIQUE(name, parent)
                ON CONFLICT IGNORE)`;

        const folders = `
            CREATE TABLE IF NOT EXISTS tree_data (
                id integer PRIMARY KEY,
                tree_id integer UNIQUE,
                permissions text)`;

        //this.db.run(`DROP TABLE tree`);
        //this.db.run(`DROP TABLE tree_data`);

        this.db.run(users);
        this.db.run(groups);
        this.db.run(folders);
        this.db.run(tree);

        this.db.run(
            'INSERT OR IGNORE INTO users (name,email,user_pass,user_group,is_admin) VALUES (?,?,?,?,?)',
            ['Admin', 'admin@manage', bcrypt.hashSync('12345', 8),'SuperAdmin', 1],
            err => { 
                //console.log(err);
        })

        this.db.run(
            'INSERT OR IGNORE INTO groups (name,change,remove,download,upload,permission) VALUES (?,?,?,?,?,?)',
            ['SuperAdmin', 1, 1, 1, 1, 0],
            err => { 
                //console.log(err);
        })
        this.db.run(
            'INSERT OR IGNORE INTO groups (name,change,remove,download,upload,permission) VALUES (?,?,?,?,?,?)',
            ['CustomUser', 1, 1, 0, 1, 0],
            err => { 
                //console.log(err);
        })
        this.db.run(
            'INSERT OR IGNORE INTO groups (name,change,remove,download,upload,permission) VALUES (?,?,?,?,?,?)',
            ['ReadOnly', 0, 0, 0, 0, 0],
            (err) => { 
                //console.log(err);
        })
        this.db.run(
            'INSERT OR IGNORE INTO groups (name,change,remove,download,upload,permission) VALUES (?,?,?,?,?,?)',
            ['DownloadOnly', 0, 0, 1, 0, 0],
            (err) => { 
                //console.log(err);
        })
        return true;
    }

    selectByEmail(email, callback) {
        return this.db.get(
            `SELECT * FROM users WHERE email = ?`,
            [email], 
            (err, row) => {
                callback(err, row);
            })
    }

    insertUser(user, callback) {
        return this.db.run(
            'INSERT INTO users (name,email,user_group,user_pass,is_admin) VALUES (?,?,?,?,?)',
            user, 
            err => {
                callback(err);
            })
    }

    updateUser(user, callback) {
        return this.db.run(
            `UPDATE users SET name = ?,user_group = ? WHERE email = ?`,
            user, 
            err => {
                callback(err);
        })
    }

    changePass(user, callback) {
        return this.db.run(
            `UPDATE users SET user_pass = ? WHERE email = ?`,
            user, 
            err => {
                callback(err);
        })
    }

    removeUser(email, callback) {
        return this.db.run(
            `DELETE FROM users WHERE email = ?`,
            [email], 
            (err, row) => {
                callback(err);
            })
    }

    selectUsers(callback) {
        return this.db.all(
            `SELECT * FROM users`, 
            (err, rows) => {
                callback(err,rows);
        })
    }

    getAllFolders(callback) {
        return this.db.all(
            `SELECT * FROM tree`, 
            (err, rows) => {
                callback(err,rows);
        })
    }

    getAllPermissions(callback) {
        return this.db.all(
            `SELECT * FROM tree_data`, 
            (err, rows) => {
                callback(err,rows);
        })
    }

    async getTreeItem(name, parent) {
        const row = await this.getAsync(
            `SELECT * FROM tree WHERE name = ? AND parent = ?`, 
            [name, parent]
        );
        return row;
    }

    async insertTreeItem(name, parent) {
        const id = await this.runAsync(
            'INSERT OR IGNORE INTO tree (name, parent) VALUES (?,?)', 
            [name, parent]
        );

        return id;
    }

    //changing path in database
    renameItem(data, callback) {
        return this.db.run(
            `UPDATE tree SET name = ? WHERE name = ? AND parent = ?`,
            data, 
            err => {
                callback(err);
        })
    }
    //removing item
    async removeItem(data) {
        const id = await this.runAsync(
            `DELETE FROM tree WHERE name = ? and parent = ?`,
            data
        )
        return id;
    }

    /* Begin --- Tree item's permissions */
    async insertPermission(tree_id, permissions) {
        const id = await this.runAsync(
            'INSERT OR IGNORE INTO tree_data (tree_id, permissions) VALUES (?,?)', 
            [tree_id, permissions]
        );
        return id;
    }

    async selectPermission(tree_id) {
        const row = await this.getAsync(
            `SELECT * FROM tree_data WHERE tree_id = ?`, 
            [tree_id]
        );
        return row;
    }

    //changing path in database
    updatePermission(data, callback) {
        return this.db.run(
            `UPDATE tree_data SET permissions = ? WHERE tree_id = ?`,
            data, 
            err => {
                callback(err);
        })
    }

    async removePermission(tree_id) {
        return await this.runAsync(
            `DELETE FROM tree_data WHERE tree_id = ?`,
            [tree_id]
        )
    }
    /* End --- Tree item's permissions */

    async selectGroup(name) {
        const row = await this.getAsync(
            `SELECT * FROM groups WHERE name = ?`, 
            [name]
        );
        return row;
    }

    selectGroups(callback) {
        return this.db.all(
            `SELECT * FROM groups`, 
            (err, rows) => { 
                callback(err, rows);
        })
    }
}

module.exports = new Db('sqlitedb');