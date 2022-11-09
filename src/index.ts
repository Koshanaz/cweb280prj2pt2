import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as createError from "http-errors";
import {Request, Response} from "express";
import {Joke} from "./entity/Joke";
import * as process from "process";
import {JokeController} from './controller/JokeController';
import {RouteDefinition} from './decorator/RouteDefinition';
import {create} from "domain";
import * as cors from 'cors';
import {JokeUser} from "./entity/JokeUser";

// CORS options
const corsOptions = {
    origin: /localhost\:\d{4}$/i, //localhost any 4 digit port
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Access-Control-Allow-Credentials',
    methods: 'GET,PUT,POST,DELETE',
    maxAge: 43200, // 12 hours in seconds
}

createConnection().then(async connection => {

    const app = express();
    app.use(bodyParser.json());

    // CORS
    app.use(cors(corsOptions)); // enable CORS for all handlers
/*
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if(req.xhr && req.accepts('application/json')) next();
        else next(createError(406));
    });

 */
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if(req.headers.authorization.toString().startsWith("Bearer")) next();
        else next(createError(406));
    });

    app.options('*', cors(corsOptions));

    [
        JokeController,
    ].forEach((controller) => {
        const instance = new controller();
        const path = Reflect.getMetadata('path', controller);
        const routes: Array<RouteDefinition> = Reflect.getMetadata('routes', controller);
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

    app.use(function(req, res, next) {
        next(createError(404));
    });

    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({status: err.status, message: err.message, stack: err.stack.split(/\s{4,}/)});
    });

    const port = process.env.PORT || 3004;
    app.listen(port);

    // insert new users for test
    await connection.manager.save(connection.manager.create(JokeUser, {
        userName: "Wright",
        token: "IcaNAddanDdelETEjokES",
        accessLevel: "WRITE"
    }));
    await connection.manager.save(connection.manager.create(JokeUser, {
        userName: "Reid",
        token: "onLYallOWEDtoreADanDraTE",
        accessLevel: "READ"
    }));

    console.log(`Express server has started on port ${port}. Open http://localhost:${port}/users to see results`);

}).catch(error => console.log(error));
