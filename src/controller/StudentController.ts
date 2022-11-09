import {getRepository, Like} from 'typeorm';
import {NextFunction, Request, Response} from 'express';
import {Student} from '../entity/Student';
import {Controller} from '../decorator/Controller';
import {Route} from '../decorator/Route';
import {validate, ValidatorOptions} from 'class-validator';
import {Joke} from "../entity/Joke";
@Controller('/students')
export default class StudentController {
    private studentRepo = getRepository(Student); // Student Repository
// https://github.com/typestack/class-validator#passing-options
    private validOptions: ValidatorOptions = {
        stopAtFirstError: true,
        skipMissingProperties: false,
        validationError: {target: false, value: false},
    };
    @Route('get', '/:id*?') // the *? makes the param optional - see https://expressjs.com/en/guide/routing.html#route-paramters
        async read(req: Request, res: Response, next: NextFunction) {
        if (req.params.id) return this.studentRepo.findOne(req.params.id);
        else {
            const findOptions:any = {order: {}, where: []}; // prepare order and where props
            return this.studentRepo.find(findOptions);
        }
    }

    @Route('delete', '/:id')
    async delete(req: Request, res: Response, next: NextFunction) {
        const studentToRemove = await this.studentRepo.findOne(req.params.id);
        res.statusCode = 204;
        if (studentToRemove) return this.studentRepo.remove(studentToRemove);
        else next();
    }
    @Route('put', '/:id')
    async update(req: Request, res: Response, next: NextFunction) {
        /* PRELOAD - https://typeorm.io/#/repository-api
        Creates a new entity from the a plain javascript object.
        If the entity already exists in the database, then it loads it and replaces all values with
        the new ones from the given object,
        and returns a new entity that is actually an entity loaded from the database with all
        properties replaced from the new object.
        Note that given entity-like object must have an entity id / primary key to find entity by.
        Returns undefined if entity with given id was not found.
        */
        const studentToUpdate = await this.studentRepo.preload(req.body);
// Extra validation - ensure the id param matached the id submitted in the body
        if (!studentToUpdate || studentToUpdate.id != req.params.id) next(); // pass the buck until 404 error is sent
    else {
            const violations = await validate(studentToUpdate, this.validOptions);
            if (violations.length) {
                res.statusCode = 422; // Unprocessable Entity
                return violations;
            } else {
                return this.studentRepo.save(studentToUpdate);
            }
        }
    }

    @Route('post')
    async save(request: Request, response: Response, next: NextFunction) {
        // get the metadata/decorations from the Joke Object and fill with the values in the request body (which does not have any decorations)
        console.log(request.body.firstName);
        console.log(request.params.firstName);
        const newStudent = Object.assign(new Student(), request.body);
        console.log(newStudent);
        const violations = await validate(newStudent, this.validOptions);
        console.log(violations);
        if (violations.length) {
            response.statusCode = 422; // Uncrossable Entity
            return violations;
        } else {
            response.statusCode = 201; // Created
            return this.studentRepo.save(newStudent);
        }
    }
}
