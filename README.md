# File Browser

Full-stack web application with RESTfull API backend

Frontend:

_**Vue**_

Backend:

_**NodeJS**_


### Application covers next goals

- [x] User authentification

- [x] Support actions with files and folders:

	- browse
	- remove
	- upload
	- download

- [x] Manage files and folders access

- [x] Manage users

- [x] Save permanent data to database

- [ ] Edit file

- [ ] Manage groups


## Installation

```
npm install
```

### Run application

1\. Build frontend application for production

```
npm run build
```

2\. Run server

Set path to your content folder in `config.js`

By default, server uses a path `../dist`, wherein must be located
frontend app sources
  
```
npm run server/app
```

3\. Go to page `ip:4000/login` and login up with

**Login**: _admin@manage_

**Password**: _12345_

Change a password or add new user at page `ip:4000/admin`

### Vue-cli development server

```
npm run serve
```

# License

This code is unlicensed and can be used for any purposes for free