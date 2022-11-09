import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
/* This imports the entity using the class name in its .ts file, and its path */
import {User} from "../entity/User";
import {Controller} from '../decorator/Controller';
import {Route} from '../decorator/Route';
import { NotFoundException } from '@nestjs/common';
import {validate, ValidatorOptions} from 'class-validator';

@Controller('/users') // the base path is http://localhost:3004/users
export class UserController {

    private userRepository = getRepository(User);
    private validOptions: ValidatorOptions;

    @Route('get') // IF the GET HTTP Request Method is used then run the action below
    async all(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find();
    }
/*
Exercise 12: Please handle the scenario when the records are not found
please refer to this for some help if you need
https://medium.com/the-crowdlinker-chronicle/best-way-to-inject-repositories-using-typeorm-nestjs-e134c3dbf53c
 */
    @Route('get', '/:id') // IF a param is specified then the path is http://localhost:3004/users/1
    async one(request: Request, response: Response, next: NextFunction) {
        let userToFind = await this.userRepository.findOne(request.params.id);
        if(userToFind) {
            return userToFind;
        } else next();
        /*
        .then(entity => {
            if (!entity) {
                response.statusCode = 404;
                // return new NotFoundException('Model not found.');
                return Promise.reject(
                     new NotFoundException('Model not found.')
                );
            }

            return Promise.resolve(entity ? entity : null);
        }).catch(error => Promise.reject(error));
         */
    }

    @Route('put', '/:id') // IF a param is specified then the path is http://localhost:3004/users/1
    async update(request: Request, response: Response, next: NextFunction) {
        let userToUpdate = await this.userRepository.preload(request.body);
        if(!userToUpdate || userToUpdate.id != request.params.id) next();
        else {
            let violations = await validate(userToUpdate, this.validOptions);
            if (violations.length) {
                response.statusCode = 422;
                return violations;
            } else {
                return this.userRepository.save(userToUpdate);
            }
        }
    }

    @Route('post') // IF the POST HTTP Request Method is used then run the action below
    async save(request: Request, response: Response, next: NextFunction) {
        // get the metadata/decorations from the User Object and fill with the values in the request body (which does not have any decorations)
        console.log(request.body.firstName);
        console.log(request.params.firstName);
        const newUser = Object.assign(new User(), request.body);
        console.log(newUser);
        const violations = await validate(newUser, this.validOptions);
        console.log(violations);
        if (violations.length) {
            response.statusCode = 422; // Uncrossable Entity
            return violations;
        } else {
            response.statusCode = 201; // Created
            return this.userRepository.save(newUser);
        }
    }

    /*
    async save(request: Request, response: Response, next: NextFunction) {
        response.statusCode = 201 // Created
        return this.userRepository.save(request.body);
    }

     */
    @Route('delete', '/:id') // IF the DELETE HTTP Request Method is used then run the action below
    async remove(request: Request, response: Response, next: NextFunction) {
        const userToRemove = await this.userRepository.findOne(request.params.id);
        response.statusCode = 204; // No Content
        if (userToRemove) return this.userRepository.remove(userToRemove);
        else next(); // let index.ts catch the 404 error and reply with JSON
    }

}
