import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as createError from "http-errors";
import {Request, Response} from "express";
import {Joke} from "./entity/Joke";
import * as process from "process";
import {JokeController} from './controller/JokeController';
import StudentController from "./controller/StudentController";
import {RouteDefinition} from './decorator/RouteDefinition';
import {create} from "domain";
import * as cors from 'cors';
import {Student} from "./entity/Student";
// CORS options

const corsOptions = {
    origin: /localhost\:\d{4}$/i, //localhost any 4 digit port
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    methods: 'GET,PUT,POST,DELETE',
    maxAge: 43200, // 12 hours in seconds
}

createConnection().then(async connection => {

    // create express app
    const app = express();
    app.use(bodyParser.json());
    // CORS time
    app.use(cors(corsOptions)); // enable CORS for all handlers

    // require headers 'X-Requested-With: XmlHttpRequest' and 'Accept:application/json'
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if(req.xhr && req.accepts('application/json')) next();
        else next(createError(406));
    });
    // add handler for pr-flight options request to ANY path wtf does this mean
    app.options('*', cors(corsOptions));

    // register express routes from defined application routes
/*
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });
*/


    // setup express app here
    // ...

    // Iterate over all our controllers and register our routes

    [
        StudentController,
        JokeController,
    ].forEach((controller) => {
    // This is our instantiated class
    // eslint-disable-next-line new-cap
        const instance = new controller();
    // The prefix saved to our controller
        const path = Reflect.getMetadata('path', controller);
    // Our `routes` array containing all our routes for this controller
        const routes: Array<RouteDefinition> = Reflect.getMetadata('routes', controller);
    // Iterate over all routes and register them to our express application
        routes.forEach((route) => {
            app[route.method](path+route.param,
                (req:express.Request, res:express.Response, next:express.NextFunction) => {
                const result = instance[route.action]( req, res, next );
                if (result instanceof Promise) {
                    result.then((result) => result !== null && result !== undefined ? res.send(result): next())
                        .catch((err) => next(createError(500, err)) );
                } else if (result !== null && result !== undefined) res.json(result);
            });
        });
    });

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        next(createError(404));
    });

    // error handler
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({status: err.status, message: err.message, stack: err.stack.split(/\s{4,}/)});
    });

    // start express server
    const port = process.env.PORT || 3004;
    app.listen(port);

    console.log(`Express server has started on port ${port}. Open http://localhost:${port}/users to see results`);

}).catch(error => console.log(error));
