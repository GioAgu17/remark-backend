# Remark API

Remark API is a Serverless monorepo project for exposing RESTful services to the frontend user of Remark. The project uses [Lerna](https://lerna.js.org) and [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

- Designed to scale for larger projects
- Maintains internal dependencies as packages
- Uses Lerna to figure out which services have been updated 
- Supports publishing dependencies as private NPM packages
- Uses [serverless-bundle](https://github.com/AnomalyInnovations/serverless-bundle) to generate optimized Lambda packages
- Uses Yarn Workspaces to hoist packages to the root `node_modules/` directory

-----
