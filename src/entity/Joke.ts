import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {
    IsOptional,
    Min,
    Max,
    IsNotEmpty,
    IsEnum
} from 'class-validator';

export enum JokeType {
    'dad',
    'programming',
    'general'
}

@Entity()
export class Joke {

    @PrimaryGeneratedColumn()
    @IsOptional()
    id: number;

    @Column('nvarchar', {length: 20})
    @IsEnum(JokeType, {message: 'Type should be dad, programming or general'})
    type: string;

    @Column('nvarchar', {nullable: false})
    @IsNotEmpty({message: 'Setup is Required'})
    setup: string;

    @Column('nvarchar', {nullable: false})
    @IsNotEmpty({message: 'Punchline is Required'})
    punchline: string;

    @Column('numeric', {default: 3.0})
    @Min(1.0, {message: 'Lowest rating possible is 1.0'})
    @Max(5.0, {message: 'Highest rating possible is 5.0'})
    @IsOptional()
    averageRating: number;

    @Column('integer', {default: 1})
    @Min(1, {message: 'Lowest Rating Count is 1'})
    @IsOptional()
    ratingCount: number;
}
