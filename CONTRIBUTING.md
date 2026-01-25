# Contributing to Common

Thanks for your interest in Common! This is a privacy-first, minimal tool, and contributions should align with that philosophy.

## Philosophy

- **Privacy first**: No tracking, no cookies, no email collection
- **Calm and minimal**: Simple UX, no noise, no notifications
- **Extensible but focused**: Support future tools but keep each tool simple
- **Mobile-friendly**: Always design for touch and small screens first

## How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists
2. Open a new issue with:
   - Clear description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if relevant

### Code Contributions

1. **Fork and clone the repository**

```bash
git clone https://github.com/yourusername/Common.git
cd Common
```

2. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**

- Follow the existing code style
- Keep changes focused and minimal
- Test on mobile devices or responsive view
- Ensure no new dependencies unless absolutely necessary

4. **Test locally**

```bash
npm install
npm run dev
```

5. **Commit with clear messages**

```bash
git commit -m "Add feature: brief description"
```

6. **Push and create a Pull Request**

```bash
git push origin feature/your-feature-name
```

## Code Style

- Use TypeScript with strict types
- Follow the existing patterns
- Use Tailwind CSS for styling
- Keep components simple and readable
- Add comments for complex logic

## What We're Looking For

### High Priority

- Bug fixes
- Mobile UX improvements
- Performance optimizations
- Accessibility improvements
- Documentation improvements

### Medium Priority

- New tool implementations (readiness, blockers)
- UI polish
- Better error handling

### Not Accepting

- Third-party analytics or tracking
- User accounts or authentication
- Email/notification features
- Complex dependencies
- Features that compromise privacy

## Questions?

Open an issue or use the Feedback page on the site.

---

Thank you for helping keep Common simple and privacy-focused! 🙏
