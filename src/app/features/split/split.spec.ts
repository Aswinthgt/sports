import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Split } from './split';

describe('Split', () => {
  let component: Split;
  let fixture: ComponentFixture<Split>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Split],
    }).compileComponents();

    fixture = TestBed.createComponent(Split);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
