'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard-kit/components/ui/card';
import { ProjectSelector } from './components/project-selector';
import { MigrationPreview } from './components/migration-preview';
import { MigrationStatus } from './components/migration-status';
import { migrateMultipleProjects } from './actions';
import type { OldProject, MigrationResult } from './actions';

type Step = 'select' | 'preview' | 'running' | 'complete';

interface MigrateContentProps {
  oldProjects: OldProject[];
}

export function MigrateContent({ oldProjects }: MigrateContentProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const selectedProjects = oldProjects.filter((p) => selectedIds.includes(p.id));

  const handleStartMigration = () => {
    setStep('running');
    setResults([]);

    startTransition(async () => {
      const migrationResults = await migrateMultipleProjects(selectedIds);
      setResults(migrationResults);
      setStep('complete');
    });
  };

  const handleReset = () => {
    setStep('select');
    setSelectedIds([]);
    setResults([]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/planning"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-display-sm text-foreground">Migrate from Development Dashboard</h1>
            <p className="text-muted-foreground">
              Select projects to bring into Planning Studio
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'select'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1. Select
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2. Preview
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'running' || step === 'complete'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3. Migrate
          </span>
        </div>
      </header>

      {/* Main content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'select' && 'Select Projects'}
            {step === 'preview' && 'Preview Migration'}
            {step === 'running' && 'Migrating...'}
            {step === 'complete' && 'Migration Complete'}
          </CardTitle>
          <CardDescription>
            {step === 'select' &&
              'Choose which projects from the old Development Dashboard to migrate'}
            {step === 'preview' &&
              'Review how your projects will be mapped to Planning Studio'}
            {step === 'running' &&
              'Your projects are being migrated to Planning Studio'}
            {step === 'complete' &&
              'Your projects have been migrated successfully'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Select */}
          {step === 'select' && (
            <ProjectSelector
              projects={oldProjects}
              selected={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <MigrationPreview projects={selectedProjects} />
          )}

          {/* Step 3: Running/Complete */}
          {(step === 'running' || step === 'complete') && (
            <MigrationStatus
              results={results}
              isRunning={step === 'running'}
              totalCount={selectedIds.length}
            />
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {step === 'select' && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/planning">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Planning
              </Link>
            </Button>
          )}
          {step === 'preview' && (
            <Button variant="outline" onClick={() => setStep('select')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step === 'complete' && (
            <Button variant="outline" onClick={handleReset}>
              Migrate More
            </Button>
          )}
        </div>

        <div>
          {step === 'select' && (
            <Button
              onClick={() => setStep('preview')}
              disabled={selectedIds.length === 0}
            >
              Next: Preview
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleStartMigration} disabled={isPending}>
              <Upload className="h-4 w-4 mr-2" />
              Start Migration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
