import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class JokeUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('nvarchar',{length: 20})
    userName: string;

    @Column('nvarchar',{length: 64})
    token: string;

    @Column('nvarchar',{length: 20})
    accessLevel: string;
}
