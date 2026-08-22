# Opexnal Connect

Build and upgrade the existing Opexnal project into a complete, original, global social-media platform with a feature set comparable in breadth to major modern social networks.

CORE RULES

Brand name: Opexnal

Tagline: Create. Connect. Grow.

Build an original product.

Do not copy Instagram's source code, logo, proprietary assets, or private/internal systems.

Use original Opexnal branding and UI.

Keep the application mobile-first, modern, fast, scalable, secure and accessible.

Do not create fake functionality: important features must have real backend architecture or clearly be marked as requiring a third-party integration.

Build incrementally without breaking existing working features.

1. COMPLETE SOCIAL FEATURES

Implement:

Accounts

Sign up

Login

Logout

Email verification

International phone verification

OTP

Forgot/reset password

Account recovery

Session/device management

Two-factor authentication

Public/private accounts

Account deactivation

Permanent account deletion

Personal-data export

Profiles

Profile photo

Username

Display name

Bio

Website

Location

Posts count

Followers/following

Follow/unfollow

Follow requests

Mutual followers

Mention/tag users

Profile sharing

QR/profile sharing

Block

Restrict

Mute

Report

Feed

Home feed

Following feed

Recommended feed

Photo posts

Video posts

Carousel posts

Captions

Hashtags

Mentions

Locations

Likes

Comments

Replies

Shares

Reposts

Saves

Hide post

Not interested

Report

Infinite scrolling/pagination

Stories

Photo/video/text stories

Stickers

Polls

Questions

Mentions

Locations

Links

Music/audio where legally available

Reactions

Replies

Story privacy

Close Friends

Viewer list

Story archive

Highlights

Highlight editing/deletion

Automatic expiration

Short Videos / Reels

Vertical video feed

Video upload

Video recording

Trimming

Cover selection

Captions

Hashtags

Mentions

Original audio

Audio pages

Likes

Comments

Replies

Shares

Reposts

Saves

Follow creator

View count

Watch history

Report

Recommendation-ready architecture

Search & Explore

Search users

Search usernames

Search hashtags

Search posts

Search videos

Search audio

Search locations

Search history

Suggestions

Trending content

Recommended creators

Explore grid

Personalized discovery architecture

Messaging

One-to-one messaging

Group chats

Text

Images

Videos

Voice messages

Reactions

Replies

Forwarding

Delete/unsend

Message requests

Read status

Typing indicator

Online status

Mute

Archive

Block

Report

Notifications

Likes

Comments

Replies

Follows

Follow requests

Mentions

Tags

Messages

Story interactions

Reposts

System notifications

Push notifications

Notification preferences

2. CREATOR & BUSINESS FEATURES

Support account types:

Personal

Creator

Business

Creator dashboard:

Followers

Reach

Engagement

Post analytics

Video analytics

Audience analytics

Growth analytics

Professional dashboard

Prepare architecture for:

Creator subscriptions

Tips/support

Paid content

Monetization

Advertising

Business profiles

Do not enable real payments until proper payment providers, legal requirements and configuration are completed.

3. AUDIO & MUSIC

Create an extensible audio system for:

Original audio

Audio discovery

Audio pages

Save audio

Use audio in videos

Audio attribution

Do not provide copyrighted commercial music unless appropriate licensing/rights exist.

4. LIVE VIDEO

Create modular architecture for:

Live sessions

Live title

Audience controls

Viewer count

Live comments

Moderation

Blocking/reporting viewers

Live ending

Replay storage

Keep live infrastructure scalable and separable later.

5. GLOBAL PLATFORM

Make Opexnal worldwide-ready.

Support:

International phone numbers

Country selection

Multiple time zones

UTC backend timestamps

Local date/time formatting

Multiple currencies

Regional configuration

Global content discovery

Right-to-left languages

Initial languages:

English

Hindi

Spanish

French

Portuguese

German

Arabic

Indonesian

Japanese

Korean

Make additional languages easy to add.

6. DATABASE & BACKEND

Use a standard portable architecture:

Frontend:

React Native

Expo

TypeScript

Backend:

Node.js

TypeScript

Express or equivalent open-source framework

Database:

PostgreSQL

Storage:

S3-compatible object storage

Create proper migrations and models for:

users profiles sessions two_factor_auth posts post_media comments comment_replies likes follows follow_requests stories story_views story_highlights reels audio hashtags saved_posts collections notifications conversations conversation_members messages message_reactions reports blocks restrictions mutes close_friends verification_requests creator_accounts analytics ad_accounts campaigns subscriptions payments admin_users roles permissions audit_logs

Use foreign keys, indexes, constraints and efficient queries.

7. MEDIA INFRASTRUCTURE

Store large media files in object storage rather than PostgreSQL.

Support:

Images

Videos

Audio

Profile photos

Story media

Implement:

Upload

File validation

Size limits

Safe filenames

Image optimization

Thumbnails

Video processing/transcoding architecture

Controlled access

CDN-compatible delivery

Deletion

Backup

8. OWNER CONTROL

The application must remain fully portable and owner-controlled.

The owner must control:

Complete source code

GitHub repository

Backend

Database

Media storage

Domain

Cloud infrastructure

API credentials

Authentication credentials

App signing

Google Play account

Apple Developer account

Production admin account

Do not permanently lock production functionality to this AI builder.

Provide:

Complete source code

README

Database migrations

API documentation

Environment documentation

Deployment instructions

Backup instructions

Restore instructions

Architecture documentation

Use .env.example.

Never hard-code production secrets.

9. ADMIN PANEL

Create a secure Owner/Admin dashboard.

Dashboard:

Total users

Active users

New users

Posts

Videos

Stories

Reports

Engagement

Growth

Management:

Users

Posts

Videos

Stories

Comments

Reports

Appeals

Moderation

Verification

Platform settings

Roles:

Owner

Super Admin

Moderator

Support

Implement strict server-side role-based authorization.

Do not create hidden master passwords, secret admin accounts or backdoors.

10. HIGH SECURITY

Design Opexnal using a security-first, defense-in-depth architecture.

Important: do not claim that the application is "unhackable" or 100% secure. The goal is to prevent attacks, detect them quickly, contain them and recover safely.

Authentication

Argon2id or equivalent modern password hashing

Strong password policy

Secure sessions

Refresh-token rotation where applicable

Session revocation

Device/session management

Mandatory 2FA for administrators

Login attempt protection

Suspicious-login detection

Secure account recovery

Never store plaintext passwords.

Authorization

Every protected API endpoint must verify:

Authentication

Authorization

Resource ownership

Required role/permission

Prevent:

IDOR

Privilege escalation

Unauthorized admin access

Cross-user data access

Never trust user-supplied role or permission values.

API Security

Implement:

HTTPS/TLS

Input validation

Output validation

Rate limiting

Request-size limits

Secure error handling

Abuse detection

Never expose stack traces, database errors or secrets to clients.

Injection Protection

Protect against:

SQL injection

XSS

CSRF where applicable

Command injection

SSRF

Path traversal

Unsafe deserialization

Malicious redirects

File Security

Validate:

MIME type

Extension

File size

Filename

Prevent executable uploads and path traversal.

Secrets

Never hard-code:

Database passwords

API keys

JWT secrets

Encryption keys

Storage credentials

Admin credentials

OAuth secrets

Never commit production secrets to GitHub.

Use environment variables or a secrets manager.

Rate Limiting

Rate-limit:

Login

OTP

Password reset

Signup

API calls

Likes

Comments

Follows

Messages

Uploads

Reports

Add abuse detection and progressive protection.

Admin Security

Require:

Mandatory 2FA

Role-based access control

Session timeout

Re-authentication for critical actions

Security alerts

Audit logs

Never create hidden backdoors.

Network Security

Use:

Firewall rules

Private networking where appropriate

TLS

Restricted administrative access

Do not expose PostgreSQL or internal services directly to the public internet unless properly secured and genuinely required.

Security Monitoring

Monitor:

Failed logins

Suspicious logins

Privilege changes

Admin actions

Unusual API traffic

Rate-limit violations

Account takeover indicators

Server errors

Database anomalies

Create alerts for high-risk events.

Audit Logs

Record security-sensitive actions such as:

Login/logout

Failed authentication

Password changes

2FA changes

Permission changes

Admin actions

Account deletion

Security-setting changes

Never log passwords, tokens or other secrets.

11. BACKUPS & DISASTER RECOVERY

Implement:

Automated database backups

Encrypted backups

Media backup strategy

Multiple recovery points

Restore testing

Disaster recovery documentation

Backups must not be accessible using ordinary application credentials.

12. ACCOUNT TAKEOVER PROTECTION

Detect unusual:

Login locations

Devices

Sessions

Password-reset activity

Email changes

Phone changes

Require additional verification for high-risk account changes.

Notify users about important security events.

13. MODERATION & SAFETY

Implement:

Report user

Report post

Report video

Report Story

Report comment

Report message

Spam detection

Abuse detection

Moderation queue

Temporary restrictions

Suspension

Bans

Appeals

Audit logs

Do not automatically remove legitimate content without an appropriate moderation workflow.

14. VERIFICATION

Create a verification workflow:

Verification request

Secure document submission

Review queue

Approve/reject

Additional-information request

Verification status

Verified badge

Restrict access to sensitive verification information.

15. PRIVACY

Implement:

Public/private account

Activity status

Read receipts

Message permissions

Story permissions

Mention controls

Tag controls

Comment controls

Blocked accounts

Restricted accounts

Muted accounts

Close Friends

Data export

Account deletion

Create editable:

Privacy Policy

Terms of Service

Community Guidelines

Copyright/Content Policy

Safety Center

Account deletion instructions

Do not claim automatic legal compliance. Provide configurable privacy infrastructure that can be reviewed for each jurisdiction.

16. PERFORMANCE & SCALABILITY

Design for growth from thousands toward millions of users.

Use:

Pagination

Database indexes

Efficient queries

Caching where appropriate

Background jobs

Queue architecture

CDN

Image optimization

Video transcoding architecture

Monitoring

Health checks

Error tracking

Rate limiting

Do not create unnecessary microservices initially.

Keep the architecture modular so components can be separated as scale requires.

17. ACCESSIBILITY

Support:

Screen readers

Accessible labels

Dynamic text sizes

Captions/subtitles

Alt text

Keyboard accessibility where applicable

Appropriate contrast

18. ANALYTICS

Create privacy-conscious analytics for:

DAU

MAU

Retention

Engagement

Content creation

Video views

Watch time

Follower growth

Creator analytics

Reports

Moderation statistics

Do not collect unnecessary personal information.

19. TESTING

Before production deployment, include:

Unit tests

API tests

Authentication tests

Authorization tests

Permission tests

Upload tests

Basic mobile UI tests

Security checks

Dependency vulnerability scanning

Secret scanning

Static analysis

Test Opexnal only on infrastructure owned or explicitly authorized by Opexnal.

20. PRODUCTION DEPLOYMENT

Prepare the project for:

Android

iOS

Google Play

Apple App Store

Production backend

PostgreSQL

Object storage

CDN

HTTPS

Domain

Monitoring

Backups

Separate development and production environments.

Never put development credentials into production builds.

21. FINAL DELIVERY

Provide:

Complete source code

Mobile application

Backend API

Admin panel

PostgreSQL schema

Database migrations

.env.example

API documentation

README

Deployment guide

Backup/restore guide

Security checklist

Architecture documentation

Testing instructions

If any feature requires a third-party service, clearly identify it and provide configuration instructions rather than pretending the integration is complete.

FINAL GOAL

Create Opexnal as an original, global, scalable social-media platform with broad functionality comparable to a major social network.

Priorities:

Security

Privacy

Owner control

Performance

Scalability

Reliability

Accessibility

Global readiness

Maintainability

The AI builder is only a development tool.

The Opexnal owner must retain legitimate control over the source code, infrastructure, database, storage, domain, credentials, publishing accounts and administrator access.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c317be2d-2c8f-4954-9c58-14c027ea53bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
