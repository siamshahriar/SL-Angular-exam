import { Component } from '@angular/core';
import { EventTimetableComponent } from './components/event-timetable/event-timetable.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ EventTimetableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'sel-exam-v2';
}
