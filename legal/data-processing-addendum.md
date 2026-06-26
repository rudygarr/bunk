> **⚠️ DRAFT — NOT YET LEGALLY REVIEWED.** Working template for CampHQ. A Data
> Processing Addendum (DPA) is the document a school, church, or other institution
> will often require before using the Service. Have a licensed attorney review it,
> and keep the Annexes (especially the sub-processor list) accurate and current.
> Replace every **[BRACKETED]** placeholder.

# CampHQ Data Processing Addendum (DPA)

This Data Processing Addendum ("DPA") forms part of the agreement between the
Organizer ("Customer," "Controller," "you") and [Company Legal Name] ("CampHQ,"
"Processor," "we") for the Customer's use of the Service (the "Agreement," e.g.,
the CampHQ Terms of Service). If there is a conflict between this DPA and the
Agreement on data-protection matters, this DPA controls.

**How to accept:** [Choose one — e.g., "This DPA is automatically incorporated into
the Terms of Service and applies to all Customers," or "A countersigned copy is
available on request to [privacy@yourdomain]."]

## 1. Roles of the parties

- The **Customer is the Controller** of the personal information of its camp
  participants (campers, parents/guardians, volunteers, and staff) and decides the
  purposes and means of processing.
- **CampHQ is the Processor** and processes that information **only on the
  Customer's documented instructions** to provide the Service.
- Where the Customer is a **school or acts for a school**, CampHQ acts as a
  **"school official"** under FERPA with a legitimate educational interest, under
  the school's direct control with respect to the use and maintenance of education
  records.

## 2. Scope and purpose of processing

CampHQ processes personal information solely to provide and support the Service —
managing rosters, transportation, lodging, groups, schedules, attendance,
announcements, and related camp logistics — as described in **Annex A**, and for
no other purpose. CampHQ will **not**:

- sell personal information or "share" it for cross-context behavioral
  advertising;
- use personal information (including student or children's data) to build
  profiles or for targeted advertising; or
- use the data to train models or for any purpose other than providing the
  Service, except for limited, aggregated/de-identified service-improvement and
  security purposes that do not identify any individual.

## 3. Customer (Controller) obligations

The Customer represents and warrants that it has the lawful basis and all
necessary rights, notices, and consents to provide the personal information to
CampHQ — **including any verifiable parental consent required under COPPA** for
children under 13 and any consents required under FERPA and applicable state
student-privacy laws.

## 4. Processor obligations

CampHQ will:

a. process personal information only on the Customer's documented instructions
   (including this DPA and Service configuration), unless required by law;
b. ensure personnel authorized to process the data are bound by confidentiality;
c. implement appropriate technical and organizational security measures
   (**Annex B**);
d. assist the Customer, taking into account the nature of processing, in
   responding to data-subject/parent requests and in meeting the Customer's
   security, breach-notification, and assessment obligations;
e. make available information reasonably necessary to demonstrate compliance; and
f. delete or return personal information as described in Section 8.

## 5. Sub-processors

- The Customer provides **general authorization** for CampHQ to engage the
  sub-processors listed in **Annex C** to provide the Service.
- CampHQ will impose data-protection obligations on each sub-processor that are
  substantially similar to those in this DPA and remains responsible for their
  performance.
- CampHQ will provide a way to learn of new sub-processors (e.g., this list /
  email notice) and the Customer may object on reasonable data-protection grounds;
  the parties will work in good faith to address the objection.

## 6. Data-subject and parent requests

If CampHQ receives a request from a participant, parent, or guardian to access,
correct, delete, or export personal information, CampHQ will, where permitted,
direct the request to the Customer and assist the Customer in responding.

## 7. Personal-data breach notification

CampHQ will notify the Customer **without undue delay, and in any case within
[72] hours**, after becoming aware of a confirmed breach of security leading to the
accidental or unlawful destruction, loss, alteration, or unauthorized disclosure
of or access to personal information processed under this DPA, and will provide
information reasonably available to help the Customer meet its obligations.

## 8. Return and deletion

Upon expiration of a camp's lifecycle, termination of the Agreement, or the
Customer's request, CampHQ will, at the Customer's choice, return and/or delete
the personal information it processes, except where retention is required by law
(e.g., limited billing records). Deletion includes purging from backups on a
rolling basis.

## 9. Audits

CampHQ will make available, on reasonable written request and no more than
**[once per year]** (or after a breach), information and/or third-party audit
reports/certifications reasonably necessary to demonstrate compliance with this
DPA, subject to confidentiality.

## 10. International transfers

If personal information is transferred across borders, the parties will rely on a
lawful transfer mechanism (e.g., Standard Contractual Clauses) where required.
[For a US-only product serving US camps, you may state: "The Service stores and
processes personal information in the United States."]

## 11. Children's and student data (specific terms)

For information about minors and any student education records:

- CampHQ uses the data **only** to provide the Service to the Customer's camp and
  under the Customer's control.
- CampHQ does not retain, use, or disclose such data beyond the Service, does not
  sell it, and does not use it for advertising or profiling.
- Ownership of student/education records and the data therein remains with the
  Customer (and/or the student/parent as applicable).
- Upon termination, such data is returned and/or deleted per Section 8.

## 12. Liability and term

This DPA is effective for as long as CampHQ processes personal information for the
Customer. Liability under this DPA is subject to the limitations in the Agreement.

---

## Annex A — Details of processing

- **Subject matter:** provision of the CampHQ camp-management Service.
- **Duration:** the term of the Agreement and each camp's lifecycle.
- **Nature & purpose:** hosting, organizing, displaying, and transmitting camp
  data to authorized users to run the camp.
- **Categories of data subjects:** campers (including minors), parents/guardians,
  volunteers, and staff.
- **Categories of personal data:** identity/contact (name, email, phone),
  grade/age, gender, group/bus/cabin/team assignments, attendance, schedule, and
  announcements.
- **Special/sensitive categories (if enabled by Customer):** health information
  such as allergies, medications, dietary needs, and emergency contacts.

## Annex B — Technical and organizational security measures

[Summarize your actual measures, e.g.:]
- Encryption of data in transit (TLS); encryption at rest via the database
  provider.
- Passwords stored only as salted hashes; identity verification for participant
  accounts.
- Server-enforced, role-based access controls (row-level security) limiting each
  user to the data they are authorized to see.
- Access to production data limited to authorized personnel under confidentiality.
- Logging, monitoring, and regular backups.
- Vendor due diligence for sub-processors.

## Annex C — Authorized sub-processors

| Sub-processor | Purpose | Location |
|---|---|---|
| Supabase, Inc. | Database, authentication, hosting | [United States] |
| Stripe, Inc. | Payment processing (Organizer billing) | [United States] |
| [Email provider, e.g., Resend/Postmark] | Transactional email (verification, invites, notifications) | [United States] |
| [Hosting/CDN, e.g., Vercel/Netlify] | Web application hosting | [United States] |

---

**Signatures (if a countersigned copy is used):**

Customer: ______________________  Date: __________
CampHQ ([Company Legal Name]): ______________________  Date: __________
