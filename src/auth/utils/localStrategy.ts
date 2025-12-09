import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";


@Injectable()
export class Localstrategy extends PassportStrategy(Strategy){
constructor(private authService:AuthService){

super({

usernameField: 'email',


})

}

validate(email: string, password: string){
    if(password === "") throw new UnauthorizedException ("Please Provide the Password")
    return this.authService.validateUser(email,password)
}

}