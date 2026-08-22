# Contour Education

A consultation booking app built with Next.js and Supabase. Students book, reschedule, and cancel consultations; admins get a read-only view of every consultation across all students.

## Features

- Email/password auth via Supabase (`@supabase/ssr`), with role-gated dashboards (`student` vs `admin`)
- Students: book a consultation (multi-step dialog), toggle status, reschedule, cancel
- Admins: read-only table of every consultation, grouped by student
- Styling with [Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com/)
- Unit tests with [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later, and npm
- [Docker](https://www.docker.com/) running (the Supabase CLI runs Postgres, Auth, Storage, etc. as containers) — Docker Desktop or an equivalent daemon
- No global installs needed — the Supabase CLI is a project dependency and is run via `npx`/`npm`

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local Supabase stack

```bash
npx supabase start
```

This applies every migration in `supabase/migrations` and seeds local dev data from `supabase/seed.sql`: 3 students + 1 admin, all with password `password123` (see the seed file for the exact emails — `seed-admin1@example.com` is the ready-made admin login).

The first run pulls several Docker images and can take a few minutes. When it finishes, it prints a table of local URLs and keys — keep that output, you need it for the next step.

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in the two variables using the values `supabase start` printed:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the "Publishable key" (or "anon key") from the `supabase start` output>
```

If you closed that output, `npx supabase status` reprints the same values.

### 4. Run the app

```bash
npm run dev
```

The app runs on [localhost:3000](http://localhost:3000/) and redirects to `/auth/login`. Log in with one of the seeded accounts from step 2 (e.g. `seed-admin1@example.com` / `password123` for the admin view, or `seed-student1@example.com` / `password123` for the student view).

### 5. Creating an admin user manually

There's no self-service way to become an admin from the UI — every new sign-up defaults to the `student` role (see `supabase/migrations/20260821134843_create_profile_trigger.sql`). If you want to promote an account you signed up yourself (rather than using the seeded `seed-admin1@example.com`), flip its role directly in the database:

1. Sign up through the app at `/auth/sign-up` (or use an already-existing account).
2. Open Supabase Studio at [127.0.0.1:54323](http://127.0.0.1:54323) → **SQL Editor**, and run:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Log out and back in (or refresh) so the app picks up the new role.

## Testing

```bash
npm test        # run once
npm run test:watch
```

## Database changes

Schema changes go through `supabase/migrations` (`npx supabase migration new <name>`), not manual edits in Studio — `supabase db reset` replays every migration plus `seed.sql` from scratch.


## Approach

### Consultations Table
Schema:
id: uuid*
student_id: uuid*
first_name: string*
last_name: string*
consult_reason: string
date_time: timestampz
status: enum( scheduled, completed, cancelled) default: scheduled

Opted for a uuid approach to create a unique primary key id. There can be an argument that another data type would scale better but for this project's use case and the fact that postgressql can handle millions of records of this shape. Opted to lean on something familiar and simple. student_id is a foreign key that references auth.users.id that already comes built in with the supabase nextjs boilerplate. This was a good starting point in establishing a relationship between this table and the profiles table. Additionally, it becomes a reference for role based access checks throughout the project. Also, another decision point is making the consult_reason not null. Early on, I thought this was okay: an admin only needs first name and last name to identify the user and know the date and time of the consultation. But as the project progressed, I realized that this was needed in the client side as some form of header to identify between bookings for the user. Arguably, you can use some form of booking id but using the consult_reason is more human-readable. I'll have this as a point of improvement if I iterate on this project again. As for status, I opted not to include incomplete for simplicity. Better UX would dictate that the user can save their work as they go through a goal like booking a consultation so this is also another fast-follow/point of improvement for the project. Adding created_at and updated_at as well would be helpful for future features I reckon. I can imagine a world where we can have a job that identifies cancelled or incomplete consultation bookings and we can send automated emails to them to finish a booking or encourage them to make a new one. 

### Profiles Table
Schema:
id: uuid*
created_at: timestampz
role: enum( student, admin ) default: student

Also opted for the bare minimum with the Profiles table. id, similar to student_id, references auth.users.id. This relationship allows us to identify the roles of the user and display content accordingly. For roles, I settled for student and admin. The student role can make CRUD updates on their consultation bookings but are forbidden to go an admin's interface. The admin role on the other hand has read only access to all bookings made by students. Honestly, I didn't think to prohibit admins from booking their own consultations as well and just assumed that admins may also book consultations. Because there's not a lot of time given for this exercise, I opted for these two roles as the MVP. Given more time, I think the next iteration would be to introduce more roles and even within these roles, create granular permissions depending on the type of access they need. For example, we can introduce a staff role that may have a lot of admin actions available to them but are prohibited from seeing student data for example. Also, I purposefully made student the default role. The app focused a lot on the functionalities for the student and I assume that in the real world there would be more students than admin. However, this can be revisited if assigning a default role on the onset would have major drawbacks especially in the event more nuaced roles are introduced.

## RLS
I added policies in both tables to satisfy the P0 requirements of this project: I added CRUD policies in the consultations table that only allowed a user to make updates to their own consultations and another policy to allow anyone with an admin role to view all consultations. Profiles also has 2 policies enabled: a user has access to their own profile data and admin can see the profiles of other admins. The latter really is to be able to see admin users who book consultations. It also future proofs the project a bit by establishing a way to access admin data in case there would be a need for an interface to "promote" a non-admin user to an admin role or even change an admin role to something else altogether. If we're strictly just sticking with the scope of the project, this can be improved by just revoking access to the student-dashboard when you're an admin and removing the policy altogether. 

I'd also like to point out that I've added RLS in the project despite not being a hard requirement is because I thought it was important; ensuring a layer of security especially for actions that mutate a user is essential especially in the context of privacy. The last thing this app needs is another student having admin access or being able to alter the consultation schedule of another student altogether. As an additional bonus, the supabase boilerplate really made this difficult not to include too!

## Setting Admin Roles
I opted to not have any mechanisms to create an admin role within the app because I think this should be scoped in a different project altogether. There should be a separate internal process to add admin accounts if we want to support this feature.

## Native DateTime Input
Opted to use the native datetime input instead of a picker library to avoid bloat and also due to time constraints. Most offices at Contour have 9:30am - 9:30pm business hours anyway so this can just be displayed in 30 minute increments. I don't feel strongly on the approach here so I can be pursuaded to use a ready-made solution especially if it improves the UX of this entire process.

## Admin Table
Similar to the DateTime Input, I opted to display the bookings in the simplest way possible to fulfill the MVP of the project. Clearly, there's a lot of room for improvement on this page. Creating a more dedicated table or using other packages already has a table with sort and search capabilities will vastly improve the usability of this table. At this present iteration, it's definitely not scalable; search and pagination are two features that would greatly increase this view's utility. Another improvement is being redirected to a student's profile page upon clicking their student_id on this table. There's so much you can do with an LMS and this is profile view can contain all the information of the particular user and we can also introduce features here that can help students accomplish their objectives such as rescheduling consultations for them or tracking their progress.

## Testing
Added some unit tests to address core functionalities on the consultation card since a lot of business logic lives there but this app would benefit more with end to end tests. For now, functionalities were just tested manually. There would be more confidence in shipping this app to production if we can outline the user journey from logging in to making a booking and updating an existing booking. From the admin side, just being able to confirm that they can see the table of consultations is going to be quite helpful. I would definitely add this in the next iteration of the app.

Also took a little bit of time testing out the policies by manual testing. I wasn't very familiar with Supabase and NextJS and had a snafu with all the mock data I created in Studio getting deleted when I ran supabase reset. I really had to create those migrations and seed data first so I don't have to keep creating the tables and mock data over and over again. 

## Claude use
Claude was pretty instrumental in fixing a few bugs during development and helping me finish this project. I went over my timeboxed hours in the backend side of things because of my unfamiliarity with supabase and nextjs and I genuinely wanted to go over it slowly and learn the frameworks. I was pretty amazed with how easy supabase can set things up but there was still a lot of boilerplate to go through and it was pretty easy to get lost in the weeds. Client side was a bit easier since the boilerplate already had shadcn ui installed and there were ready-made components available that suited the project. On top of that, I was pretty familiar with react and just used tailwind on a recent project so it was easier to understand what Claude was doing. SQL creation too was pretty easy thanks to the AI tool.

## Other Considerations

### Add first name and last name in profiles table once a consultation is booked
It's probably safe to assume that the one booking the consultations will always have the same first and last name associated with their log in. Once this information is available, we can set this in the profiles table and have it auto fill future consultation bookings

## Summary
What it is: A consultation booking app (Next.js + Supabase) where students book/reschedule/cancel their own consultations and admins get a read-only view across all students.

Auth & roles: Supabase email/password auth (@supabase/ssr), with a profiles table (id → auth.users.id, role enum student/admin, default student) driving role-gated dashboards. No in-app way to create admins — done manually via SQL against the seeded/local DB.

Data model: A consultations table (id, student_id FK, first_name, last_name, consult_reason not-null, date_time, status enum scheduled/completed/cancelled, default scheduled). No incomplete status, no created_at/updated_at yet — called out as fast-follows.

Access control: RLS on both tables even though not strictly required — students can only CRUD their own consultations, admins get read-all on consultations; profiles are visible to self, and admins can see other admins' profiles (kept mainly so admin-booked consultations still resolve, and to future-proof role management).

UI decisions (explicitly scoped down for time): native <input type="datetime"> instead of a picker library; a plain HTML table for the admin view instead of a sortable/searchable/paginated component — both flagged as the biggest usability gaps if iterated on.

Testing: Unit tests (Vitest + RTL) only on ConsultationCard, since most business logic lives there; everything else was manually tested. E2E coverage of the login → book → update flow is called out as the top testing gap.

Notable self-identified gaps/next steps: no admin-self-booking guardrail, no granular roles (e.g., a "staff" role), no admin drill-down into a student's profile, and no auto-fill of name from profile on booking.





