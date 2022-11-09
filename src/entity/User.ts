import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {IsOptional, Length, IsInt, Min, Max, MaxLength, IsNotEmpty} from 'class-validator';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    @IsOptional()
    id: number;

    @Column('nvarchar', {length: 50})
    @Length(1, 50, {message: 'First Name must be from $constraint1 to $constraint2 characters'})
    @IsNotEmpty({message: 'First Name is Required'})
    firstName: string;

    @Column('nvarchar', {length: 50, nullable: true})
    @MaxLength( 50, {message: 'Last Name must be at most $constraint1 characters'})
    @IsOptional()
    lastName: string;

    @Column('integer')
    @Min(1, {message: 'Minimum value is 1'})
    @Max(120,{message: 'Maximum value is 120'})
    age: number;

}
