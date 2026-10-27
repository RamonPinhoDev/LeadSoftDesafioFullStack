import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Services } from './services/services/services';
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly service = inject(Services);
  private readonly router = inject(Router);
  @HostListener('window:pagehide')
  encerrarSessaoDaJanela(): void {
    this.service.sair();
  }
  pular(evento: Event): void {
    evento.preventDefault();
    document.getElementById('conteudo')?.focus();
  }
  sair(): void {
    this.service.sair();
    void this.router.navigateByUrl('/login');
  }
}
