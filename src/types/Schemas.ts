export interface Post {
    id: number;
    userId : number;
    title : string;
    body: string;
}

export interface Person {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    city: string;
    country: string;
  }

export type UserSchema = {
    id: number;
    name: string;
    email: string;
  };