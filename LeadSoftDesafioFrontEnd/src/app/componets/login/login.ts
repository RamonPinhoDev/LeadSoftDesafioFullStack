import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Services, mensagemErro } from '../../services/services/services';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly service = inject(Services);
  private readonly router = inject(Router);
  readonly frm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly mostrarSenha = signal(false);
  ngOnInit(): void {
    if (this.service.estaAutenticado()) {
      void this.router.navigateByUrl('/admin');
      return;
    }
    void this.service.prepararRecaptcha().catch((e) => this.erro.set(mensagemErro(e)));
  }
  async entrar(): Promise<void> {
    if (this.carregando()) return;
    this.frm.markAllAsTouched();
    if (this.frm.invalid) return;
    this.erro.set('');
    this.carregando.set(true);
    const { email, senha } = this.frm.getRawValue();
    try {
      await this.service.entrar(email, senha);
      this.frm.controls.senha.reset();
      await this.router.navigateByUrl('/admin');
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
}
