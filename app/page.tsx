import { Card, CardContent } from '@/components/atoms/Card';
import Nexus from '@/components/nexus/nexus';
/**
 * CrossDonate Homepage - Exact V0 Design Replica
 * @returns
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nexus SDK Demo Section - Enhanced */}
      <section className="py-10 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-foreground mb-4">Nexus SDK DEMO</h2>
            </div>

            <div className="flex justify-center">
              <Card className="border-0 shadow-xl gradient-card glass-effect w-full max-w-4xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Cross-chain operation
                  </h3>
                  <Nexus />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
