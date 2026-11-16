# ServiceHub backend contract

The existing React pages remain the UI specification. API base: `/api/v1`.
JSON amounts at the API boundary are INR; persistence uses integer paise. Roles
are uppercase database enums and lowercase response values. Dates/slots retain
`YYYY-MM-DD` and `hh:mm AM/PM`; appointment timestamps are stored as UTC and
interpreted in Asia/Kolkata. IDs are opaque strings (seed IDs are retained).

## Operations and authorization

| Frontend operation/source | REST operation | Permission and response |
|---|---|---|
| auth/LoginPage, SignupPage, AppContext | POST auth/login, auth/signup; POST auth/refresh, auth/logout; GET users/me | Signup only customer/provider. Access JWT in memory, rotating opaque refresh cookie. User response excludes all credentials. |
| CustomerProfilePage; BookingWizard | PUT customers/me/addresses | Customer only; `{addresses:[{id,label,addressLine,city,pincode,isDefault}]}`. Unique IDs, Home/Work/Other, six digits, one default when nonempty. Returns profile. |
| all role profile pages | PATCH users/me | Allowlisted profile fields; role and superuser never writable. Returns profile. |
| ProviderProfilePage, ProviderOnboardingPage | GET providers/:id; PUT providers/me; PUT providers/me/availability | Own private profile; approved public profile excludes contacts/documents. Submission enters submitted; admin moderation supplies reason. |
| ProviderModerationPage | GET providers; POST providers/:id/moderation | Admin only. draft/submitted/changes_requested/approved/rejected/suspended. |
| LandingPage, ServiceSearchPage, ServiceDetailPage | GET categories; GET services; GET services/:id; GET services/:id/reviews | Only published listings with approved providers. Search/title/category/description, category, maxPrice, price_low/price_high/rating. |
| ListingManagerPage; AdminServicesPage; ListingModerationPage | POST services; PATCH services/:id; DELETE services/:id | Provider owner or admin. Price, duration, slots validated. Publish requires approved profile. Delete archives; history retained. |
| ServiceDetailPage; JobDetailPage | GET services/:id/available-slots?date=&excludeId= | Exclusion only for an owned booking; schedule, lead, buffers, blackout, duration and provider conflicts checked. |
| BookingWizard | POST bookings | Customer identity from session. Service price and provider from DB. Address snapshot, scheduledDate/Slot, notes, paymentMethod. Concurrent requests serialized per provider. |
| customer booking pages; provider job pages; admin inspector | GET bookings; GET bookings/:id | Customer/provider own records; admin all; arbitrator assigned-case bookings only. Flattened booking response preserves timeline, review, payment, hearing and ruling fields. |
| JobRequestActions, providerUtils, JobDetailPage | POST bookings/:id/{accept,decline,start,complete,cancel} | Explicit state machine; provider owner for work actions; customer owner for cancel. Complete requires notes. Financial and notification changes transactional. |
| JobDetailPage; BookingDetailPage | POST bookings/:id/time-proposals; POST bookings/:id/time-proposal-response | Provider proposes `{date,slot}`; customer `{accept}`. Original slot reserved; acceptance atomically rechecks proposed slot. |
| BookingDetailPage; ReviewsPage | POST bookings/:id/review; POST bookings/:id/review-reply | Completed customer-owned unreviewed booking, integer rating 1–5, text; reply by provider owner. |
| AdminRevenuePage; EarningsPage | GET admin/revenue; GET bookings | Simulated payments only; 5% fee of retained funds, cash collected at completion, capped idempotent refunds. |
| SupportTicketPage; TicketResolutionPage | GET/POST tickets; POST tickets/:id/resolve | Customer owns booking. Admin outcomes: full/50% simulated refund, redo, warning, arbitration escalation. |
| DisputeFilingPage; ProviderDisputeResponse; dispute pages | GET/POST disputes; GET disputes/:id; POST disputes/:id/response | Customer may file during in_progress/completed. One open case per booking. Provider owner may respond until ruled. Evidence references uploaded private files. |
| DisputeAssignmentPage | POST disputes/:id/assignment | Admin selects an actual arbitrator account. |
| HearingSchedulerPage; RulingIssuancePage | POST disputes/:id/hearing; POST disputes/:id/ruling | Assigned arbitrator only. Future valid hearing and HTTP(S) URL. One ruling. Restore previous booking status; refund at most remaining simulated collection; award separately recorded. |
| ArbitratorSignupWizard; ArbitratorApplicationPage | POST arbitrator-applications; GET arbitrator-applications; POST :id/approve or reject | Public application with hashed password; admin review without hash. Approval creates account atomically; duplicate email conflicts rejected. |
| NotificationDrawer; AppContext | GET notifications; POST notifications/read | Authenticated user's notifications only. Optional notificationId; polling/focus refresh. |
| AdminAccountsPage; profile activity views | GET admin/accounts; GET admin/activity | Admin directory/logs; trusted actor audit generated by server. |
| PostAJobPage | GET/POST custom-job-requests | Persist customer-owned request; no dispatch/quotation promise. |
| avatar/listing/evidence controls | POST uploads; GET uploads/:id | Multipart limit, content type checks, generated path. Public images; evidence accessible only to owner, case parties, assigned arbitrator or admin. |
| DemoSwitcherBar | POST auth/demo-switch; POST admin/demo-reset | Explicit demo flag, never production; trusted superuser origin session. |

## Response and errors

Single operations return a resource (saveService adapter wraps `{success,service}`).
Collections support `page`/`limit` and return `{items,total,page,limit}`; the frontend
adapter accumulates pages for existing dashboards. Errors return `{statusCode,
message,error}` with 400 validation, 401 authentication, 403 permission, 404 missing
or private resource, 409 conflicts. No API failures substitute mock records.
An unavailable listing detail returns `null` to preserve the catalog's empty-state
contract. Public collections remain empty when nothing matches.

## Domain invariants

Active bookings distinguish acceptance through acceptedAt. Valid progression:
active pending → active accepted → in_progress → completed. Provider decline only
pending; customer cancellation active/in_progress/reschedule_proposed. Proposal
response returns active, accepting also sets acceptedAt. Dispute records preserve
statusBeforeDispute. Listing and booking provider snapshots are separate from
current profile data. All booking mutations lock the provider row before rereading
state. Payments/refunds, timelines, notifications, and audits commit together.
Partial listing edits retain omitted fields, including publication status.
Reschedules retain the duration captured at booking. During demo impersonation,
audit entries identify the originating administrator and name the selected persona.

Legacy mock tests contain unsafe expectations (public admin signup, arbitrary actor
IDs, password aliases). API tests replace those expectations with authorization
and persistence assertions. Seed dates remain historical. Missing historical
files are represented as unavailable, never fabricated evidence.
