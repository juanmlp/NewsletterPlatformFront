import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Tag } from 'src/app/models/admin/tag.model';
import { AdminsService } from 'src/app/services/admin/admins.service';
import { User } from '../../../models/admin/user.model';
import { TagsService } from '../../../services/admin/tags.service';
import { UsersService } from '../../../services/admin/users.service';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  editable: boolean = false;
  adminInfo: any = '';
  newTags: Tag[] = [];
  newUser: User = { name: '', email: '', owner: '', tags: this.newTags, password: '' }
  tags: Tag[] = [];
  users: User[] = [];
  testList = [];
  fileCSV: boolean = false;
  fileJSON: boolean = false;
  userAdded: boolean = false;
  usersAdded: boolean = false;
  userAddedError: boolean = false;
  usersAddedError: boolean = false;
  errorType: string = '';

  convertedObj: any = "";
  convert(objArray) {
    this.testList = objArray.result;
  }

  onError(err) {
    this.convertedObj = err
    console.log(err);
  }

  constructor(
    private userServices: UsersService,
    private tagsServices: TagsService,
    private cookieService: CookieService,
    private papaParse: Papa) { }

  ngOnInit(): void {
    this.adminInfo = this.cookieService.get("currentAdminId");
    this.userServices.getAllUsers(this.adminInfo).then(u => { this.users = u });
    this.tagsServices.getAllTags(this.adminInfo).then(u => { this.tags = u });
  }


  generateRandomPassword() {
    return Math.random().toString(36).slice(2)
  }

  parsCSVFile(files: FileList): void {
    this.testList = [];
    this.fileJSON = false;
    this.fileCSV = true;
    const file: File = files.item(0);
    const reader: FileReader = new FileReader();
    reader.readAsText(file);
    reader.onload = e => {
      const csv = reader.result;
      this.papaParse.parse(csv as string, {
        header: true, // gives us an array of objects
        dynamicTyping: true,
        complete: (results) => {
          results.data.map(u => {
            this.testList.push(u)
          })
        }
      });
    }
  }

  parsJSONFile(event) {
    this.testList = [];
    this.fileJSON = true;
    this.fileCSV = false;
    const fileToLoad = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.addEventListener('load', (event) => {
      this.testList = JSON.parse(<string>event.target.result);
    });

    fileReader.readAsText(fileToLoad, 'UTF-8');
  }

  detectFile(event) {
    const csv = 'csv';
    const csvState = event.target.files[0].name.includes(csv);
    if (event.target.files[0].type === 'application/vnd.ms-excel' || csvState === true) {
      this.parsCSVFile(event.target.files);
    } else {
      this.parsJSONFile(event);
    }
  }


  selectFile() {
    if (this.fileJSON == true) {
      this.addAllUsers('JSON');
    } else if (this.fileCSV == true) {
      this.addAllUsers('CSV');
    }

  }


  addAllUsers(type: string) {
    if (type === 'CSV') {
      const list = this.testList.filter((element, index) => index < this.testList.length - 1);
      this.testList = list;
    }
    this.testList.map(u => {
      var tagsArr = [];
      if (typeof u.tags === 'undefined' || u.tags === null || u.tags === '' || u.tags.length === 0) {
        u.tags = this.tags;
      } else {
        if (type === 'CSV') {
          u.tags = u.tags.replace(/\s/g, '');
          tagsArr = u.tags.split(',');
        }
        let tempArr = [];
        tagsArr.map(u => {
          this.tags.map(tags => {
            if (u === tags.name) {
              tempArr.push(tags);
            }
          })
        })
        u.tags = tempArr;
      }
      u.owner = this.adminInfo;
      u.password = this.generateRandomPassword();
      this.userServices.post(u).then(res => {
        if (typeof res !== 'undefined') {
          let tempResTags = res.tags;
          res.tags = [];
          tempResTags.map(tempTag => {
            const exist = this.tags.find(tag => tag._id === tempTag);
            if(exist){
              res.tags.push(exist);
            }
          }) 
          this.users.push(res);
          this.usersAdded = true;
        }
      }).catch((err) => {
        console.log(err)
        this.usersAddedError = true;
        this.errorType = err.response.data;
      })
    })
  }

  editState(user: User) {
    this.editable = true;
    this.users.map((u: User) => {
      u.editable = false;
      user.editable = true;
    })

    this.tags.map(u => {
      u.checked = false;
      let exist = user.tags.find(b => b.name == u.name);
      user.tags.find(b => {
        if (b.name == u.name) {
          b.checked = true;
        }
      });

      if (!exist) {
        user.tags.push(u)
      }
    })
  }

  addUser() {
    this.newUser.owner = this.adminInfo;
    this.newUser.tags = this.tags.filter(u => u.checked == true);
    let temporalTags = this.newUser.tags;
    let newMappedUser = [];
    this.newUser.tags.map(u => {
      newMappedUser.push(u._id)
    });

    this.newUser.tags = newMappedUser;
    this.userServices.post(this.newUser).then(res => {
      if (typeof res !== 'undefined') {
        res.tags = temporalTags;
        this.users.push(res);
        this.newUser = { name: '', email: '', owner: this.adminInfo, tags: this.newTags, password: '' };
        this.userAdded = true;
        this.userAddedError = false;
      }
    }).catch(err => {
      this.userAdded = false;
      this.userAddedError = true;
      this.errorType = err.response.data;
    })
  }


  deleteUser(id: string) {
    this.userServices.deleteUser(id)
      .then(() => {
        const userFiltered = this.users.filter((user: User) => user._id != id);
        this.users = userFiltered;
      }).catch((err) => console.log(err))
  }


  updateUser(user: User) {
    let tempTags = user.tags.filter(u => u.checked == true);
    let newMappedUser = [];
    tempTags.map(u => {
      newMappedUser.push(u._id)
    });

    user.tags = newMappedUser;

    user.editable = false;
    this.userServices.updateUser(user._id, user).then(() => {
      user.tags = tempTags;
    })
  }



}
