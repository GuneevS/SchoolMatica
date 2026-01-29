# SchoolMatica

> A comprehensive assessment management system for South African schools

SchoolMatica is a modern, user-friendly platform designed to streamline assessment planning, mark capture, moderation, and reporting for South African schools. Built with educators in mind, it combines powerful functionality with an intuitive interface.

## ✨ Key Features

### 📊 Assessment Management
- **Smart Assessment Plans**: Create weighted assessment plans with automatic normalization
- **Drag & Drop Reordering**: Easily reorganize assessments with visual feedback
- **Template Library**: Start from curriculum-aligned templates
- **Multi-term Support**: Manage assessments across all school terms

### 📝 Markbook
- **Spreadsheet-like Interface**: Familiar mark entry experience
- **Auto-calculations**: SBA %, Term %, and Level mapping
- **Absent Handling**: Proper treatment of absent marks
- **Distribution Charts**: Visual performance analytics

### 🔍 Quality Assurance
- **Moderation Workflows**: Built-in discussion threads
- **Document Management**: Upload and approve rubrics, memos
- **Approval Chains**: Multi-stage approval process
- **Audit Trails**: Complete history of all changes

### 👥 Learner Management
- **Registration System**: Capture and approve new learners
- **Class Placement**: Assign students to appropriate classes
- **Guardian Details**: Track parent/guardian information
- **Supporting Documents**: Manage enrollment paperwork

### 🎯 User Experience
- **Contextual Help**: Floating help button on every page
- **Interactive Tooltips**: Hover for instant explanations
- **Welcome Guidance**: Onboarding tips for new users
- **Smooth Animations**: Polished micro-interactions

### 📈 Reporting & Analytics
- **School Dashboard**: At-a-glance performance metrics
- **Class Performance**: Detailed class-level insights
- **At-risk Identification**: Early intervention support
- **Audit Logs**: Compliance and accountability

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+ (included via Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/schoolmatica.git
cd schoolmatica

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Seed demo data (optional)
npx prisma db seed

# Start the development server
npm run dev
```

Visit `http://localhost:44777` to see the application.

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:13808/schoolmatica?schema=public"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:13807"
AUTH_TRUST_HOST="true"
NODE_ENV="development"
```

For production:

```env
DATABASE_URL="postgresql://schoolmatica:CHANGE_PASSWORD@postgres:5432/schoolmatica?schema=public"
NEXTAUTH_SECRET="CHANGE_THIS_TO_SECURE_SECRET"
NEXTAUTH_URL="https://yourdomain.com"
REDIS_URL="redis://redis:6379"
NODE_ENV="production"
```

## 📚 Documentation

- **[Product Blueprint](/docs/PRODUCT_BLUEPRINT.md)**: High-level product vision and domain rules
- **[Help System](/docs/HELP_SYSTEM.md)**: Guide to the contextual help features
- **[UX Improvements](/docs/UX_IMPROVEMENTS.md)**: Summary of user experience enhancements
- **[Feature Summary](/docs/FEATURE_SUMMARY.md)**: Complete list of features
- **[Delivery Notes](/docs/DELIVERY_NOTES.md)**: Development milestones and decisions

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **Radix UI**: Accessible primitives
- **Recharts**: Data visualization

### Backend
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Production-grade database (containerized)
- **Zod**: Runtime validation
- **Docker**: Full containerization for all environments

### State Management
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling

## 🎨 Design Philosophy

1. **User-Centric**: Built for teachers, by understanding their workflows
2. **Progressive Disclosure**: Show complexity only when needed
3. **Consistent Patterns**: Reusable components and interactions
4. **Accessible First**: WCAG AA compliant, keyboard navigable
5. **Performance**: Fast, responsive, optimized

## 🔐 Security & Permissions

### Roles

- **Teacher**: Create plans, enter marks, view own classes
- **HOD**: Approve plans, moderate assessments, department oversight
- **SMT**: Full access, lock plans, final approvals

### Data Protection

- Audit logs for all changes
- Role-based access control
- Locked plans prevent retroactive changes
- Secure authentication (ready for integration)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Deployment

### Docker (Recommended)

```bash
# Development (with hot-reload)
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# Access application at http://localhost:13807
```

For detailed Docker setup instructions, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

### Manual Deployment

1. Build the application: `npm run build`
2. Set environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`

### Platforms

- **Vercel**: Zero-config deployment (recommended)
- **Railway**: Database + app in one place
- **DigitalOcean**: Full control with App Platform
- **AWS**: ECS or Elastic Beanstalk

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Add JSDoc comments for complex functions
- Write meaningful commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by South African educators' needs

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/schoolmatica/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/schoolmatica/discussions)
- **Email**: support@schoolmatica.com

## 🗺️ Roadmap

### Q1 2025
- [ ] Bulk student import (CSV)
- [ ] Email notifications
- [ ] Report card generation
- [ ] Parent portal

### Q2 2025
- [ ] Mobile app (iOS/Android)
- [ ] Offline support
- [ ] SMS integration
- [ ] Advanced analytics

### Q3 2025
- [ ] AI-powered insights
- [ ] Predictive analytics
- [ ] Multi-school support
- [ ] District reporting

### Q4 2025
- [ ] Integration with EMIS
- [ ] Provincial dashboards
- [ ] Learning recommendations
- [ ] Automated interventions

## 🌟 Star History

If you find SchoolMatica helpful, please consider giving it a star on GitHub! ⭐

---

**Built with ❤️ for South African educators**
