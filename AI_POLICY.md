# AI Use Policy

This policy sets out the basic rules for every project I build and release with the help of AI assistants.

It states where I use AI in development, what I don't hand over to it, and the rules I follow.

---

## AI Tools I Use

I use **Claude** (by Anthropic) to assist with development.

I follow the [Claude Acceptable Use Policy](https://www.anthropic.com/legal/aup) along with my own internal rules.

---

## How I Use AI (and Where I Don't)

I do all system design and feature planning myself. AI never makes those calls. I use it as a tool that writes code from my instructions and helps with the work.

### What AI Helps With

| Area                             | How It's Used                                                                                    |
| :------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Writing code** (main use)      | Generating code for features and bug fixes based on my designs and instructions                  |
| **Code and security reviews**    | Pointing out possible bugs or security risks in the code (I decide whether to use any of them)   |
| **Documentation**                | Drafting and polishing READMEs, other docs, and release notes                                    |
| **Release work**                 | Running routine commands for builds, archives, and release notes                                 |

### What I Handle Myself

| Area                                | Why                                                                  |
| :---------------------------------- | :------------------------------------------------------------------- |
| **Planning, design, architecture**  | How the plugin works for users is decided by me, not delegated to AI |
| **Logins and authenticated tasks**  | I handle these manually for security                                 |
| **Final quality and behavior**      | I verify quality myself with tests on real devices                   |
| **Release decisions**               | I decide when code is merged and released                            |

> **Important**: A human developer makes the final decision and approval at every step. AI is a tool that helps speed up the work. Design, specs, and the decision to release are always mine.

---

## Rules I Follow

### Copyright and Licenses

In AI-assisted development, I follow these rules:

- No copying or plagiarizing third-party code
- No reproducing external articles or official docs without permission
- No unauthorized use of images, icons, or other media
- No code that violates open-source licenses
- No altering or removing copyright and license notices

All code in the project is written under proper licenses and rights.

### Ethics and Security

I never ask AI to generate code or content that includes:

- Malicious code such as malware, backdoors, or exploit scripts
- Features that track users or invade their privacy
- Intentional security flaws
- Discriminatory, offensive, or antisocial content
- False information or designs that mislead users
- Features that break laws or platform rules

### User Data

- I don't collect or send users' personal or local data anywhere improperly.
- Real user data or personal information is never given to AI during development or debugging.

---

## My Responsibility as a Developer

For everything built with AI, I take on these responsibilities:

1. **Design and specs**: I design every feature and the overall architecture myself.
2. **Review and approval**: I review AI-generated code and decide whether to use it.
3. **Testing on real devices**: I test the plugin manually to make sure it is stable and safe.
4. **Final check before release**: I check the whole codebase for consistency and security before publishing.

Even when AI helped write the code or text, final responsibility for the result is entirely mine.
