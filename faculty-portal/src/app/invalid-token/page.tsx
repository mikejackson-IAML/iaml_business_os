import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function InvalidTokenPage() {
  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Invalid or Missing Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This link is invalid or has expired. Please use the link from your
            most recent email to access available programs.
          </p>
          <p className="text-sm text-muted-foreground">
            If you continue to have issues, please contact us at{' '}
            <a href="mailto:faculty@iaml.com" className="underline">
              faculty@iaml.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
