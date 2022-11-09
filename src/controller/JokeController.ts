import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {Joke} from "../entity/Joke";
import {JokeUser} from "../entity/JokeUser";
import {Controller} from '../decorator/Controller';
import {Route} from '../decorator/Route';
import * as createError from "http-errors";
import {IsNotEmpty, Max, Min, validate, ValidatorOptions} from 'class-validator';

class UserRating {

    @IsNotEmpty({message: 'id is required'})
    @Min(1, {message: 'Minimum value is 1'})
    id: number;

    @IsNotEmpty({message: 'UserRating is required'})
    @Min(1.0, {message: 'Lowest rating possible is 1.0'})
    @Max(5.0, {message: 'Highest rating possible is 5.0'})
    userRating: number;
}


@Controller('/jokes')
export class JokeController {

    private jokeRepository = getRepository(Joke);
    private jokeUserRepository = getRepository(JokeUser);
    private validOptions: ValidatorOptions;

    @Route('get')
    async all(request: Request, response: Response, next: NextFunction) {
        let bearer = request.headers.authorization.replace('Bearer ', '');
        let jokeUser = await this.jokeUserRepository.findOne({
            where: {
                token: [bearer]
            }
        })
        if(!jokeUser) {
            next(createError(401));
        }
        if(jokeUser.accessLevel != 'WRITE' && jokeUser.accessLevel != 'READ') {
            next(createError(401));
        }
        return this.jokeRepository.find({
            order: {
                id: "ASC",
            },
        });
    }

    @Route('get', '/:order')
    async allSorts(request: Request, response: Response, next: NextFunction) {
        let bearer = request.headers.authorization.replace('Bearer ', '');
        let jokeUser = await this.jokeUserRepository.findOne({
            where: {
                token: [bearer]
            }
        })
        if(!jokeUser) {
            next(createError(401));
        }
        if(jokeUser.accessLevel != 'WRITE' && jokeUser.accessLevel != 'READ') {
            next(createError(401));
        }
        let sortBy = request.params.order;
        // Check if sortBy is a valid input
        if(sortBy === 'id' || sortBy === 'type' || sortBy === 'averageRating' || sortBy === 'ratingCount') {
            return this.jokeRepository.find({
                order: {
                    // Fancy use of a variable as a JSON key 8)
                    [sortBy]: "ASC",
                },
            });
            // If it's not valid, sort by id
        } else {
            return this.jokeRepository.find({
                order: {
                    id: "ASC",
                },
            })
        }
    }

    @Route('put')
    async update(request: Request, response: Response, next: NextFunction) {
        let bearer = request.headers.authorization.replace('Bearer ', '');
        let jokeUser = await this.jokeUserRepository.findOne({
            where: {
                token: [bearer]
            }
        })
        if(!jokeUser) {
            next(createError(401));
        }
        if(jokeUser.accessLevel != 'WRITE' && jokeUser.accessLevel != 'READ') {
            next(createError(401));
        }
        let userRating = Object.assign(new UserRating(), request.body);
        let violations = await validate(userRating, this.validOptions);
        if(violations.length) {
            response.statusCode = 422// Unprocessable Entity
            return violations;
        } else {
            let jokeToUpdate = await this.jokeRepository.findOne(userRating.id);
            if(!jokeToUpdate) next(createError(404));
            else {
                jokeToUpdate.averageRating = ((jokeToUpdate.averageRating * jokeToUpdate.ratingCount) + userRating.userRating) / (jokeToUpdate.ratingCount + 1);
                jokeToUpdate.ratingCount++;
                return this.jokeRepository.save(jokeToUpdate);
            }
        }
    }

    @Route('post')
    async save(request: Request, response: Response, next: NextFunction) {
        let bearer = request.headers.authorization.replace('Bearer ', '');
        let jokeUser = await this.jokeUserRepository.findOne({
            where: {
                token: [bearer]
            }
        })
        if(!jokeUser) {
            next(createError(401));
        }
        if(jokeUser.accessLevel != 'WRITE') {
            next(createError(401));
        }
        let jokes = request.body;
        // Check if it's an array of jokes, otherwise add as a normal joke
        if(jokes.jokes) {
            let jokesAdded = 0;
            let invalidJokes = [];
            for (const joke of jokes.jokes) {
                const newJoke = Object.assign(new Joke(), joke);
                const violations = await validate(newJoke, this.validOptions);
                console.log(violations);
                if (violations.length) {
                    response.statusCode = 422; // Unprocessable Entity
                    invalidJokes.push(newJoke);
                } else {
                    response.statusCode = 201; // Created
                    jokesAdded++;
                    console.log("Joke saved");
                    await this.jokeRepository.save(newJoke);
                }
            }
            return {
                "jokesAdded": jokesAdded,
                "invalidJokes": invalidJokes
            }
        } else {
            const newJoke = Object.assign(new Joke(), request.body);
            const violations = await validate(newJoke, this.validOptions);
            console.log(violations);
            if (violations.length) {
                response.statusCode = 422; // Unprocessable Entity
                return violations;
            } else {
                response.statusCode = 201; // Created
                return this.jokeRepository.save(newJoke);
            }
        }
    }

    @Route('delete', '/:id')
    async remove(request: Request, response: Response, next: NextFunction) {
        let bearer = request.headers.authorization.replace('Bearer ', '');
        let jokeUser = await this.jokeUserRepository.findOne({
            where: {
                token: [bearer]
            }
        })
        if(!jokeUser) {
            next(createError(401));
        }
        if(jokeUser.accessLevel != 'WRITE') {
            next(createError(401));
        }
        if(request.body.id && request.body.id == request.params.id) {
            response.statusCode = 204;
            let jokeToRemove = await this.jokeRepository.findOne(request.params.id);
            if(jokeToRemove) {
                return this.jokeRepository.remove(jokeToRemove);
            }
            else {
                next(createError(422));
            }
        } else {
            next(createError(422));
        }
    }
}
