-- Anonymous shared-link funnel events for the Founder activity dashboard.
alter table ops_events drop constraint if exists ops_events_event_type_check;

alter table ops_events add constraint ops_events_event_type_check check (
  event_type in (
    'arrival',
    'pageView',
    'tstStart',
    'tstComplete',
    'sessionStart',
    'showResults',
    'sessionSaved',
    'returnShooter'
  )
);

create index if not exists ops_events_campaign_idx on ops_events (referral_source);
