import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Services, cpfValido, mensagemErro } from '../../services/services/services';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-cadastro',
  styleUrl: './cadastro.css',
  templateUrl: './cadastro.html',
})
export class Cadastro {
  private readonly service = inject(Services);
  private readonly fb = inject(FormBuilder);
  readonly hoje = new Date().toLocaleDateString('en-CA');
  readonly frm = this.fb.nonNullable.group({
    nome: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
        Validators.pattern(/\S.*\S/),
      ],
    ],
    cpf: [
      '',
      [
        Validators.required,
        (c: AbstractControl) => (cpfValido(c.value ?? '') ? null : { cpf: true }),
      ],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    dataNascimento: [
      '',
      [
        Validators.required,
        (c: AbstractControl) => {
          const data = new Date(`${c.value}T00:00:00`);
          const [ano, mes, dia] = String(c.value).split('-').map(Number);
          return !Number.isNaN(data.getTime()) &&
            data.getFullYear() === ano &&
            data.getMonth() + 1 === mes &&
            data.getDate() === dia &&
            c.value >= '1900-01-01' &&
            c.value <= this.hoje
            ? null
            : { data: true };
        },
      ],
    ],
  });
  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal(false);
  readonly etapa = signal('');

  invalido(campo: string): boolean {
    const controle = this.frm.get(campo);
    return !!controle?.invalid && !!controle.touched;
  }

  formatarCpf(evento: Event): void {
    const digitos = (evento.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    this.frm.controls.cpf.setValue(
      digitos
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'),
    );
  }

  async Salvar(): Promise<void> {
    if (this.enviando() || this.sucesso()) return;
    this.frm.markAllAsTouched();
    if (this.frm.invalid) return;
    const valores = this.frm.getRawValue();
    const email = valores.email.trim().toLowerCase();
    const cpf = valores.cpf.replace(/\D/g, '');
    this.enviando.set(true);
    this.erro.set('');
    this.frm.disable();
    try {
      this.etapa.set('Verificando os dados…');
      await this.service.validarUnicidade(cpf, email);
      this.etapa.set('Cadastrando…');
      await firstValueFrom(
        this.service.cadastrarCandidato({
          nome: valores.nome.trim(),
          cpf,
          email,
          senha: valores.senha,
          dataNascimento: valores.dataNascimento + 'T00:00:00',
        }),
      );
      this.sucesso.set(true);
      this.frm.controls.senha.reset();
    } catch (erro) {
      this.erro.set(mensagemErro(erro));
    } finally {
      this.enviando.set(false);
      if (!this.sucesso()) this.frm.enable();
    }
  }
}
