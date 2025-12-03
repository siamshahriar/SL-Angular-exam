import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTimetableComponent } from './event-timetable.component';

describe('EventTimetableComponent', () => {
  let component: EventTimetableComponent;
  let fixture: ComponentFixture<EventTimetableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTimetableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
