import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';

interface DateInfo {
  date: Date;
  dayName: string;
  dateString: string;
  isSelected: boolean;
}

interface TimeSlot {
  time: string;
}

interface Venue {
  id: number;
  name: string;
}

interface DateVenues {
  date: string;
  venues: Venue[];
  venueIdCounter: number;
}

interface DateTimeSlots {
  date: string;
  timeSlots: TimeSlot[];
}

interface Event {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  venueIds: number[]; // Multiple venues
  title: string;
  description: string;
  color?: string; // Color for the event
}

@Component({
  selector: 'app-event-timetable',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './event-timetable.component.html',
  styleUrl: './event-timetable.component.css'
})
export class EventTimetableComponent implements OnInit {
  @ViewChild('timeColumn') timeColumn!: ElementRef;
  @ViewChild('eventGrid') eventGrid!: ElementRef;
  @ViewChild('venueHeader') venueHeader!: ElementRef;
  
  dates: DateInfo[] = [];
  timeSlots: TimeSlot[] = [];
  venues: Venue[] = [];
  selectedDate: DateInfo | null = null;
  selectedDateIndex: number = 0;
  events: Event[] = [];
  private readonly STORAGE_KEY = 'timetable-events';
  private readonly VENUES_STORAGE_KEY = 'timetable-date-venues';
  private readonly TIMESLOTS_STORAGE_KEY = 'timetable-date-timeslots';
  private readonly DEFAULT_VENUE_COUNT = 10;
  private dateVenuesMap: Map<string, DateVenues> = new Map();
  private dateTimeSlotsMap: Map<string, DateTimeSlots> = new Map();
  
  // Predefined color palette for events
  private eventColors = [
    '#1976d2', // Blue
    '#388e3c', // Green
    '#d32f2f', // Red
    '#7b1fa2', // Purple
    '#f57c00', // Orange
    '#0097a7', // Cyan
    '#c2185b', // Pink
    '#5d4037', // Brown
    '#455a64', // Blue Grey
    '#00796b', // Teal
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.generateDates();
    this.loadTimeSlots();
    this.loadVenues();
    this.loadEvents();
  }

  // localStorage operations
  saveEvents() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
  }

  loadEvents() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.events = JSON.parse(stored);
    }
  }

  saveVenues() {
    const venuesArray = Array.from(this.dateVenuesMap.values());
    localStorage.setItem(this.VENUES_STORAGE_KEY, JSON.stringify(venuesArray));
  }

  loadVenues() {
    const stored = localStorage.getItem(this.VENUES_STORAGE_KEY);
    if (stored) {
      const venuesArray: DateVenues[] = JSON.parse(stored);
      this.dateVenuesMap = new Map(venuesArray.map(dv => [dv.date, dv]));
    }
    
    // Initialize venues for all dates if not exists
    this.dates.forEach(dateInfo => {
      const dateStr = this.getDateString(dateInfo.date);
      if (!this.dateVenuesMap.has(dateStr)) {
        this.initializeVenuesForDate(dateStr);
      }
    });
    
    // Load venues for selected date
    if (this.selectedDate) {
      this.loadVenuesForDate(this.selectedDate);
    }
  }

  initializeVenuesForDate(dateStr: string) {
    const venues: Venue[] = [];
    for (let i = 1; i <= this.DEFAULT_VENUE_COUNT; i++) {
      venues.push({
        id: i,
        name: `Venue ${i}`
      });
    }
    this.dateVenuesMap.set(dateStr, {
      date: dateStr,
      venues: venues,
      venueIdCounter: this.DEFAULT_VENUE_COUNT
    });
    this.saveVenues();
  }

  loadVenuesForDate(dateInfo: DateInfo) {
    const dateStr = this.getDateString(dateInfo.date);
    const dateVenues = this.dateVenuesMap.get(dateStr);
    if (dateVenues) {
      this.venues = [...dateVenues.venues];
    }
  }

  generateDates() {
    const today = new Date();
    const daysToShow = 20; 
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      this.dates.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dateString: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        isSelected: i === 0
      });
    }
    
    this.selectedDate = this.dates[0];
  }

  generateTimeSlots() {
    const startHour = 9;
    const endHour = 18;
    const intervalMinutes = 15;
    const slots: TimeSlot[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time: timeString });
      }
    }
    
    return slots;
  }

  saveTimeSlots() {
    const timeSlotsArray = Array.from(this.dateTimeSlotsMap.values());
    localStorage.setItem(this.TIMESLOTS_STORAGE_KEY, JSON.stringify(timeSlotsArray));
  }

  loadTimeSlots() {
    const stored = localStorage.getItem(this.TIMESLOTS_STORAGE_KEY);
    if (stored) {
      const timeSlotsArray: DateTimeSlots[] = JSON.parse(stored);
      this.dateTimeSlotsMap = new Map(timeSlotsArray.map(dts => [dts.date, dts]));
    }
    
    // Initialize time slots for all dates if not exists
    this.dates.forEach(dateInfo => {
      const dateStr = this.getDateString(dateInfo.date);
      if (!this.dateTimeSlotsMap.has(dateStr)) {
        this.initializeTimeSlotsForDate(dateStr);
      }
    });
    
    // Load time slots for selected date
    if (this.selectedDate) {
      this.loadTimeSlotsForDate(this.selectedDate);
    }
  }

  initializeTimeSlotsForDate(dateStr: string) {
    const defaultSlots = this.generateTimeSlots();
    this.dateTimeSlotsMap.set(dateStr, {
      date: dateStr,
      timeSlots: defaultSlots
    });
    this.saveTimeSlots();
  }

  loadTimeSlotsForDate(dateInfo: DateInfo) {
    const dateStr = this.getDateString(dateInfo.date);
    const dateTimeSlots = this.dateTimeSlotsMap.get(dateStr);
    if (dateTimeSlots) {
      this.timeSlots = [...dateTimeSlots.timeSlots];
    }
  }

  addTimeSlot() {
    if (!this.selectedDate) return;
    
    const dateStr = this.getDateString(this.selectedDate.date);
    const dateTimeSlots = this.dateTimeSlotsMap.get(dateStr);
    if (!dateTimeSlots) return;

    // Get the last time slot
    const lastSlot = dateTimeSlots.timeSlots[dateTimeSlots.timeSlots.length - 1];
    if (!lastSlot) return;

    // Calculate new time (15 minutes after the last slot)
    const [hours, minutes] = lastSlot.time.split(':').map(Number);
    let newMinutes = minutes + 15;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours += 1;
    }
    
    if (newHours >= 24) {
      this.showNotification('Cannot add time slot beyond 23:59.', 'error');
      return;
    }

    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

    // Check if time already exists
    if (dateTimeSlots.timeSlots.some(slot => slot.time === newTime)) {
      this.showNotification('This time slot already exists.', 'error');
      return;
    }

    // Add the new time slot
    dateTimeSlots.timeSlots.push({ time: newTime });
    
    this.timeSlots = [...dateTimeSlots.timeSlots];
    this.saveTimeSlots();
    this.showNotification(`Time slot ${newTime} added successfully!`);
  }

  canDeleteTimeSlot(timeSlot: string): boolean {
    // Check if this is a default time slot (9:00 - 17:45)
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const isDefault = hours >= 9 && hours < 18;
    return !isDefault;
  }

  deleteTimeSlot(timeSlot: TimeSlot) {
    if (!this.selectedDate) return;
    
    if (!this.canDeleteTimeSlot(timeSlot.time)) {
      this.showNotification('Cannot delete default time slots (9:00 - 17:45).', 'error');
      return;
    }

    const dateStr = this.getDateString(this.selectedDate.date);
    
    // Check if there are events using this time slot on this date
    const hasEvents = this.events.some(event => 
      event.date === dateStr && 
      (event.startTime === timeSlot.time || 
       (event.startTime < timeSlot.time && event.endTime > timeSlot.time))
    );
    
    if (hasEvents) {
      this.showNotification(
        `Cannot delete ${timeSlot.time}. Events are scheduled at this time.`,
        'error'
      );
      return;
    }

    // Delete the time slot from the specific date
    const dateTimeSlots = this.dateTimeSlotsMap.get(dateStr);
    if (dateTimeSlots) {
      dateTimeSlots.timeSlots = dateTimeSlots.timeSlots.filter(ts => ts.time !== timeSlot.time);
      this.timeSlots = [...dateTimeSlots.timeSlots];
      this.saveTimeSlots();
      this.showNotification(`Time slot ${timeSlot.time} deleted successfully!`);
    }
  }

  generateVenues() {
    // This method is no longer used as venues are date-specific
    // Kept for backward compatibility
  }

  addVenue() {
    if (!this.selectedDate) return;
    
    const dateStr = this.getDateString(this.selectedDate.date);
    const dateVenues = this.dateVenuesMap.get(dateStr);
    if (!dateVenues) return;
    
    // Find the next available venue number based on existing venues
    const existingIds = dateVenues.venues.map(v => v.id);
    let nextId = 1;
    while (existingIds.includes(nextId)) {
      nextId++;
    }
    
    const newVenue: Venue = {
      id: nextId,
      name: `Venue ${nextId}`
    };
    dateVenues.venues.push(newVenue);
    dateVenues.venues.sort((a, b) => a.id - b.id);
    dateVenues.venueIdCounter = Math.max(...dateVenues.venues.map(v => v.id));
    
    this.venues = [...dateVenues.venues];
    this.saveVenues();
    this.showNotification(`${newVenue.name} added successfully!`);
  }

  canDeleteVenue(venueId: number): boolean {
    return venueId > this.DEFAULT_VENUE_COUNT;
  }

  deleteVenue(venue: Venue) {
    if (!this.selectedDate) return;
    
    if (!this.canDeleteVenue(venue.id)) {
      this.showNotification(`Cannot delete ${venue.name}. Default venues cannot be deleted.`, 'error');
      return;
    }

    const dateStr = this.getDateString(this.selectedDate.date);
    
    // Check if there are events using this venue on this date
    const hasEvents = this.events.some(event => 
      event.date === dateStr && event.venueIds.includes(venue.id)
    );
    if (hasEvents) {
      this.showNotification(
        `Cannot delete ${venue.name}. Please delete all events associated with this venue first.`,
        'error'
      );
      return;
    }

    // Delete the venue from the specific date
    const dateVenues = this.dateVenuesMap.get(dateStr);
    if (dateVenues) {
      dateVenues.venues = dateVenues.venues.filter(v => v.id !== venue.id);
      this.venues = [...dateVenues.venues];
      this.saveVenues();
      this.showNotification(`${venue.name} deleted successfully!`);
    }
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  selectDate(date: DateInfo) {
    this.dates.forEach(d => d.isSelected = false);
    date.isSelected = true;
    this.selectedDate = date;
    this.selectedDateIndex = this.dates.indexOf(date);
    
    // Load venues for the newly selected date
    this.loadVenuesForDate(date);
    
    // Load time slots for the newly selected date
    this.loadTimeSlotsForDate(date);
  }

  onDateTabChange(index: number) {
    this.selectDate(this.dates[index]);
  }

  // Get formatted date string for comparison
  getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get events for selected date
  getEventsForSelectedDate(): Event[] {
    if (!this.selectedDate) return [];
    const dateStr = this.getDateString(this.selectedDate.date);
    return this.events.filter(e => e.date === dateStr);
  }

  // Check if a cell is part of an event
  getCellEvent(venueId: number, timeSlot: string): Event | null {
    const selectedEvents = this.getEventsForSelectedDate();
    
    for (const event of selectedEvents) {
      if (event.venueIds.includes(venueId) && this.isTimeInRange(timeSlot, event.startTime, event.endTime)) {
        return event;
      }
    }
    return null;
  }

  // Check if time is within event range
  // An event from 9:00 to 9:30 should occupy 9:00, 9:15, and 9:30 slots (inclusive of end time)
  isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    return time >= startTime && time <= endTime;
  }

  // Check if this is the first cell of the event (for rendering)
  // For consecutive venues within an event, only the first one renders (with colspan)
  isEventStart(event: Event, venueId: number, timeSlot: string): boolean {
    if (!event.venueIds.includes(venueId) || event.startTime !== timeSlot) {
      return false;
    }
    
    // Check if this venue is the start of a consecutive group
    const sortedVenueIds = [...event.venueIds].sort((a, b) => a - b);
    const venueIndex = sortedVenueIds.indexOf(venueId);
    
    // If this is the first venue, or if the previous venue is not consecutive, this is a start
    if (venueIndex === 0 || sortedVenueIds[venueIndex - 1] !== venueId - 1) {
      return true;
    }
    
    return false;
  }

  // Calculate rowspan for event
  getEventRowSpan(event: Event): number {
    const startIdx = this.timeSlots.findIndex(t => t.time === event.startTime);
    const endIdx = this.timeSlots.findIndex(t => t.time === event.endTime);
    // Add 1 because we want to include the end time slot
    return endIdx - startIdx + 1;
  }

  // Calculate colspan for event - count consecutive venues from this venue
  getEventColSpan(event: Event, venueId: number): number {
    const sortedVenueIds = [...event.venueIds].sort((a, b) => a - b);
    const startIndex = sortedVenueIds.indexOf(venueId);
    
    if (startIndex === -1) return 1;
    
    let colspan = 1;
    for (let i = startIndex + 1; i < sortedVenueIds.length; i++) {
      if (sortedVenueIds[i] === sortedVenueIds[i - 1] + 1) {
        colspan++;
      } else {
        break;
      }
    }
    
    return colspan;
  }

  // Cell click handler
  onCellClick(venueId: number, timeSlot: string) {
    const event = this.getCellEvent(venueId, timeSlot);
    
    if (event) {
      this.openEventDialog(event);
    } else {
      this.openAddEventDialog(venueId, timeSlot);
    }
  }

  // Open dialog to add new event
  openAddEventDialog(venueId: number, timeSlot: string) {
    if (!this.selectedDate) return;

    // Calculate end time (next slot)
    const startIdx = this.timeSlots.findIndex(t => t.time === timeSlot);
    const defaultEndTime = startIdx !== -1 && startIdx < this.timeSlots.length - 1 
      ? this.timeSlots[startIdx + 1].time 
      : timeSlot;

    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: {
        mode: 'add',
        venues: this.venues,
        timeSlots: this.timeSlots,
        defaultVenueId: venueId,
        defaultStartTime: timeSlot,
        defaultEndTime: defaultEndTime,
        date: this.getDateString(this.selectedDate.date),
        getOccupiedVenues: (start: string, end: string) => this.getOccupiedVenues(start, end)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEvent: Event = {
          id: this.generateEventId(),
          date: this.getDateString(this.selectedDate!.date),
          startTime: result.startTime,
          endTime: result.endTime,
          venueIds: result.venueIds,
          title: result.title,
          description: result.description,
          color: this.getEventColor()
        };
        this.events.push(newEvent);
        this.saveEvents();
        this.showNotification('Event created successfully!');
      }
    });
  }

  // Open dialog to view/edit event
  openEventDialog(event: Event) {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: {
        mode: 'edit',
        event: { ...event },
        venues: this.venues,
        timeSlots: this.timeSlots,
        getOccupiedVenues: (start: string, end: string) => this.getOccupiedVenues(start, end, event.id)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'delete') {
          this.deleteEvent(event.id);
          this.showNotification('Event deleted successfully!');
        } else if (result.action === 'save') {
          const index = this.events.findIndex(e => e.id === event.id);
          if (index !== -1) {
            this.events[index] = {
              ...event,
              startTime: result.startTime,
              endTime: result.endTime,
              venueIds: result.venueIds,
              title: result.title,
              description: result.description
            };
            this.saveEvents();
            this.showNotification('Event updated successfully!');
          }
        }
      }
    });
  }

  // Delete event
  deleteEvent(eventId: string) {
    this.events = this.events.filter(e => e.id !== eventId);
    this.saveEvents();
  }

  // Generate unique event ID
  generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get a color for an event (cycles through the color palette)
  getEventColor(): string {
    const colorIndex = this.events.length % this.eventColors.length;
    return this.eventColors[colorIndex];
  }

  // Get occupied venues for a time range (excluding a specific event ID if editing)
  getOccupiedVenues(startTime: string, endTime: string, excludeEventId?: string): number[] {
    if (!this.selectedDate) return [];
    
    const dateStr = this.getDateString(this.selectedDate.date);
    const occupiedVenues = new Set<number>();
    
    this.events
      .filter(e => e.date === dateStr && e.id !== excludeEventId)
      .forEach(event => {
        // Check if time ranges overlap
        if (this.timeRangesOverlap(startTime, endTime, event.startTime, event.endTime)) {
          event.venueIds.forEach(venueId => occupiedVenues.add(venueId));
        }
      });
    
    return Array.from(occupiedVenues);
  }

  // Check if two time ranges overlap
  // Using inclusive end times (9:00-9:30 includes 9:00, 9:15, and 9:30)
  timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  // Synchronized scrolling
  onEventGridScroll(event: any) {
    const target = event.target as HTMLElement;
    if (this.timeColumn) {
      this.timeColumn.nativeElement.scrollTop = target.scrollTop;
    }
    if (this.venueHeader && this.venueHeader.nativeElement) {
      const table = this.venueHeader.nativeElement.querySelector('table');
      if (table) {
        table.style.transform = `translateX(-${target.scrollLeft}px)`;
      }
    }
  }

  onGridScroll(event: any) {
    // This handles any parent scroll if needed
  }

  onTimeColumnWheel(event: WheelEvent) {
    event.preventDefault();
    if (this.eventGrid) {
      const scrollAmount = event.deltaY;
      this.eventGrid.nativeElement.scrollTop += scrollAmount;
    }
  }

  onVenueHeaderWheel(event: WheelEvent) {
    if (this.eventGrid) {
      // Allow horizontal scrolling on venue header
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        this.eventGrid.nativeElement.scrollLeft += event.deltaX;
      } else {
        event.preventDefault();
        this.eventGrid.nativeElement.scrollLeft += event.deltaY;
      }
    }
  }
}
