# Freelance App

This is an application to manage freelancers directory.

## Run the app

    npm run startlocal

# REST API

The REST API to the app is described below.

## User

`POST /api/v1.0/user` &mdash; Create user
`GET /api/v1.0/user` &mdash; Get list of Users
`GET /api/v1.0/user/:userId` &mdash; Get user by id
`PUT /api/v1.0/user/:userId` &mdash; Update user
`DELETE /api/v1.0/user/:userId` &mdash; Delete user

## Skill

`GET /api/v1.0/skill` &mdash; Get list of Skills

## Hobby

`GET /api/v1.0/hobby` &mdash; Get list of Hobbies

# Sample Payload

For more info regarding the sample payload, please refer to openapi.yaml in /app/src/openapi.yaml