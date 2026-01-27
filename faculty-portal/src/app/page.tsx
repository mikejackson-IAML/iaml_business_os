import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>IAML Faculty Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To view available teaching opportunities, please use the personalized
            link sent to your email.
          </p>
          <p className="text-sm text-muted-foreground">
            Haven&apos;t received an email? Contact{' '}
            <a href="mailto:faculty@iaml.com" className="underline">
              faculty@iaml.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
