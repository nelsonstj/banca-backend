## Banca backend

## Dependencies

It is necessary to have gulp and nodemon installed globally.

```
npm install -g gulp
```
```
npm install -g nodemon
```

## Running Locally
To run the environment locally run `gulp run`

If it is needed to use configuration of a particular environment it is possible to use `gulp run --type=prd` where the `--type` can be:
- prd - for production variables
- hml - for homolog variables
- dev - for development variables

## Generating Deployment Zip
To generate zip run `gulp build` and the `build.zip` will be created on the root folder.
Use the `--type=prd` flag for a production build, `--type=hml` flag for a homolog build, `--type=dev` flag for a dev build.
`.buildignore` is the file where the files and folders are excluded from the build.zip

## Generating api documentation
To generate the api documentation folder, run the command `npm run document-api` and the library will look for all the documented files on routers folder and will generate a new folder `api-documentation` on the root.
For more information on how to document your files access `https://github.com/apidoc/apidoc`

### Setup

* `npm i`

*  `./node_modules/.bin/sequelize  db:migrate --config database/development.json`

### Deploy

* `Repositório: banca-projetos-backend`
*   `Deploy`
*      `1 - zip da pasta root do projeto`
*	   `2 - transferir zip para a instancia ec2`
*	   `	- Desenv: ec2-bancas-dev `
*	   `	- Homolog: ec2-bancas-hml `
*	   `	- Prod: ec2-bancas-prd `
*	   `3 - unzip artefato na pasta /home/ubuntu `
*	   `4 - npm install na pasta root do projeto`
*	   `5 - caso haja necesidade de alterar arquivo de conf: `
*	   `	- Desenv: /home/ubuntu/config/dev.yaml`
*	   `	- Homolog: /home/ubuntu/config/homolog.yaml`
*	   `	- Prod: /home/ubuntu/config/production.yaml`
*	   `6 - Executar pm2 stop banca`
*	   `7 - Executar pm2 start banca`
*	   `8 - Checar se está up pm2 status`

* `npm i --production`

* `node app.js`
