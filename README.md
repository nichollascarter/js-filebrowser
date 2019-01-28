# File Browser

Full-stack web application with RESTfull API backend

Frontend:
    Vue

Backend:
    NodeJS

## Application covers next goals

    1. User authentification
    2. Support actions with files and folders: 
            - browse
            - remove
            - upload
            - download
    3. Manage files and folders access
    4. Manage users
    5. Save permanent data to database
    TODO:
        - Edit file
        - Manage groups

## Installation
```
npm install
```

### Run application

1. Build frontend application for production

```
npm run build
```

2. Run server

Set path to your content folder in `config.js`

By default, server uses a path '../dist', wherein must be located
frontend app sources

```
npm run server/app
```

3. Go to page `ip:4000/login` and login up with
    Login: admin@manage
    Password: 12345

Change a password or add new user at page `ip:4000/admin`

### Vue-cli development server
```
npm run serve
```

# License
This code is unlicensed and can be used for any purposes for free