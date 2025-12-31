# IAML Virtual Team

This directory contains the virtual employees organized by department. Each employee has defined skills and commands they use to accomplish their work.

## Department Structure

```
departments/
├── sales/                  # Revenue generation
│   └── employees/
│       └── research-analyst/
│
├── marketing/              # Awareness & content
│   └── employees/
│       └── content-specialist/
│
├── operations/             # Systems & quality
│   └── employees/
│       ├── ops-specialist/
│       └── qa-specialist/
│
└── product/                # Experience & design
    └── employees/
        └── design-specialist/
```

## Departments

| Department | Mission | Employees |
|------------|---------|-----------|
| [Sales](./sales/DEPARTMENT.md) | Generate revenue through discovery, qualification, and proposals | Research Analyst |
| [Marketing](./marketing/DEPARTMENT.md) | Create awareness through content and SEO | Content Specialist |
| [Operations](./operations/DEPARTMENT.md) | Keep systems running and ensure quality | Ops Specialist, QA Specialist |
| [Product](./product/DEPARTMENT.md) | Build and maintain the user experience | Design Specialist |

## How Employees Work

Each employee has:
- **ROLE.md** - Defines who they are, what they're responsible for, and how they work
- **skills/** - Interactive skills they use (questionnaires, frameworks, guidelines)
- **commands/** - Quick-action commands they execute

## Using an Employee

To invoke an employee's skill or command:
1. Navigate to the employee's directory
2. Use their commands: `/meeting-prep "Company Name"`
3. Or invoke their skills for interactive guidance

## Adding New Employees

1. Create a new folder under the appropriate department: `departments/[dept]/employees/[employee-name]/`
2. Add a `ROLE.md` defining their responsibilities
3. Add skills and commands as needed
4. Update this README and the department's DEPARTMENT.md
