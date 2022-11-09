import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Joke} from "../entity/Joke";
import {Controller} from '../decorator/Controller';
import {Route} from '../decorator/Route';
import { NotFoundException } from '@nestjs/common';
import {validate, ValidatorOptions} from 'class-validator';

@Controller('/jokes')
export class JokeController {

    private jokeRepository = getRepository(Joke);
    private validOptions: ValidatorOptions;

    @Route('get')
    async all(request: Request, response: Response, next: NextFunction) {
        return this.jokeRepository.find();
    }

    @Route('get', '/:id')
    async one(request: Request, response: Response, next: NextFunction) {
        let jokeToFind = await this.jokeRepository.findOne(request.params.id);
        if(jokeToFind) {
            return jokeToFind;
        } else next();
    }

    @Route('put', '/:id')
    async update(request: Request, response: Response, next: NextFunction) {
        let jokeToUpdate = await this.jokeRepository.preload(request.body);
        if(!jokeToUpdate || jokeToUpdate.id != request.params.id) next();
        else {
            let violations = await validate(jokeToUpdate, this.validOptions);
            if (violations.length) {
                response.statusCode = 422;
                return violations;
            } else {
                return this.jokeRepository.save(jokeToUpdate);
            }
        }
    }

    @Route('post')
    async save(request: Request, response: Response, next: NextFunction) {
        let jokes = request.body;
        // Check if it's an array of jokes, otherwise add as a normal joke
        if(jokes.jokes) {
            let jokeCount = 0;
            let failArray = [];
            for (const joke of jokes.jokes) {
                const newJoke = Object.assign(new Joke(), joke);
                const violations = await validate(newJoke, this.validOptions);
                console.log(violations);
                if (violations.length) {
                    response.statusCode = 422; // Uncrossable Entity
                    failArray.push(newJoke);
                } else {
                    response.statusCode = 201; // Created
                    jokeCount++;
                    await this.jokeRepository.save(newJoke);
                }
            }
            return {
                "jokesAdded": jokeCount,
                "invalidJokes": failArray
            }
        } else {
            const newJoke = Object.assign(new Joke(), request.body);
            const violations = await validate(newJoke, this.validOptions);
            console.log(violations);
            if (violations.length) {
                response.statusCode = 422; // Uncrossable Entity
                return violations;
            } else {
                response.statusCode = 201; // Created
                return this.jokeRepository.save(newJoke);
            }
        }
    }

    @Route('delete', '/:id')
    async remove(request: Request, response: Response, next: NextFunction) {
        const jokeToRemove = await this.jokeRepository.findOne(request.params.id);
        response.statusCode = 204; // No Content
        if (jokeToRemove) return this.jokeRepository.remove(jokeToRemove);
        else next(); // let index.ts catch the 404 error and reply with JSON
    }

}
