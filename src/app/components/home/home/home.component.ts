import { principal } from './../../../models/principal';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Fanfic } from 'src/app/models/fanfics';
import { Post } from 'src/app/models/post';
import { User } from 'src/app/models/user';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  Fanfic: Fanfic[] = [];
  post: Post[] = [];
  Users: Map<number, string> = new Map();
  isLoggedIn = false;
  username: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const authToken = localStorage.getItem('authToken');
    this.isLoggedIn = !!authToken;

    if (this.isLoggedIn) {
      this.getCurrentUser().then(() => {
        this.username = localStorage.getItem('username');
      });
    }

    this.loadUsers();
  }

  getCurrentUser(): Promise<void> {
    return new Promise((resolve) => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return resolve();

      const headers = new HttpHeaders({ Authorization: `Bearer ${authToken}` });

      this.http.get<User>('http://localhost:3000/currentUser', { headers })
        .subscribe(user => {
          this.username = user.username;
          localStorage.setItem('username', user.username);
          resolve();
        }, error => {
          console.error("Ошибка загрузки пользователя:", error);
          resolve();
        });
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    this.isLoggedIn = false;
    this.username = null;
    this.router.navigate(['/login']);
  }

  loadUsers() {
    const authToken = localStorage.getItem('authToken');

    const headers = authToken
      ? new HttpHeaders({ Authorization: `Bearer ${authToken}` })
      : new HttpHeaders();

    this.http.get<User[]>('http://localhost:3000/users', { headers })
      .subscribe(users => {
        users.forEach(user => {
          const userID = Number(user.id) || user.userID;
          if (userID && user.username) {
            this.Users.set(userID, user.username);
          } else {
            console.warn("Некорректный пользователь:", user);
          }
        });
        this.showRandomBooks();
        this.showRandomPosts();
      }, error => {
        console.error("Ошибка при загрузке пользователей:", error);
      });
  }

  showRandomBooks() {
    if (this.Users.size === 0) return;

    this.http.get<any[]>('http://localhost:3000/fanfic')
      .subscribe(data => {
        if (!data || data.length === 0) {
          console.error('Ошибка: пустой ответ от сервера', data);
          return;
        }

        const randomFanfics = data
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

        this.Fanfic = randomFanfics.map(fanfic => {
          const userID = Array.from(this.Users.entries())
            .find(([id, name]) => name === fanfic.author)?.[0] || 0;

          const authorLogin = this.Users.get(userID) || 'Неизвестный автор';

          console.log(`Fanfic userID: ${userID}, author: ${authorLogin}`);

          return new Fanfic({ ...fanfic, userID, authorLogin }, this.Users);
        });
      });
  }

  showRandomPosts() {
    this.http.get<any[]>('http://localhost:3000/posts')
      .subscribe(response => {
        if (!response || response.length === 0) {
          console.error('Ошибка: пустой ответ от сервера', response);
          return;
        }

        const postsArray = response[0];

        if (!Array.isArray(postsArray)) {
          console.error('Ошибка: postsArray не массив', postsArray);
          return;
        }

        const randomPosts = postsArray
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

        this.post = randomPosts
          .map(post => post ? new Post(post, this.Users) : null)
          .filter((post): post is Post => post !== null);
      });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToUserPage() {
    this.router.navigate(['/userpage/:id']);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  goToBlogsPage() {
    this.router.navigate(['/blogs']);
  }

  goToReadComponent(fanficId: number) {
    this.router.navigate(['/fanfic', fanficId]);
  }

  goToBlogComponent(postId: number) {
    this.router.navigate(['/blogs', postId]);
  }
}

