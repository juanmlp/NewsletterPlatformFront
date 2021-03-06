import { Injectable } from '@angular/core';
import axios from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/app/models/users/user.model';
import { UserOwner } from 'src/app/models/users/userowner.model';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from './authentication.service';

const apiUrl = environment.apiUrl

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private cookieService: CookieService,
    private authenticationService: AuthenticationService) { }
  
  options = {
    headers: {
      'Authorization': this.cookieService.get('token_access')
    }
  }

  getUserById(id: string): Promise <UserOwner> {
    return axios.get(`${apiUrl}users/${id}`, this.options)
    .then(res => {
      return res.data
    })
  }

  deleteUser(id: string) {
    return axios.delete(`${apiUrl}users/deleteSelf/${id}`, this.options)
    .then(() => {
      this.authenticationService.logOut();
    })
  }

  updateUser(id: string, user: UserOwner) {
    return axios.patch(`${apiUrl}users/editself/${id}`, user, this.options)
      .then(res => {
        return res.data;
      })
  }
}

