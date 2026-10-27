import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Services } from './services/services/services';
import { Cadastro } from './componets/cadastro/cadastro';
import { Galeria } from './componets/galeria/galeria';
import { Login } from './componets/login/login';
import { Candidatos } from './componets/candidatos/candidatos';

export const acessoAutenticado: CanActivateFn = () =>
  inject(Services).estaAutenticado() || inject(Router).createUrlTree(['/login']);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'galeria',
    canActivate: [acessoAutenticado],
    component: Galeria,
    title: 'Galeria criativa | LeadSoft',
  },
  {
    path: 'cadastro',
    component: Cadastro,
    title: 'Cadastrar | LeadSoft',
  },
  { path: 'login', component: Login, title: 'Login | LeadSoft' },
  {
    path: 'admin',
    canActivate: [acessoAutenticado],
    component: Candidatos,
    title: 'Candidatos | LeadSoft',
  },
  {
    path: 'admin/candidato/:id',
    canActivate: [acessoAutenticado],
    component: Candidatos,
    title: 'Inscrição | LeadSoft',
  },
  { path: 'candidatos', redirectTo: 'admin' },
  { path: '**', redirectTo: 'login' },
];
