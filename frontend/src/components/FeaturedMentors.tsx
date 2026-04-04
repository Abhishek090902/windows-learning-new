import MentorCard from './MentorCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMentors } from '@/hooks/useApi';

const FeaturedMentors = () => {
  const { ref, isVisible } = useScrollReveal();
  const { data: mentors = [], isLoading } = useMentors({ limit: 4 });
  const featured = mentors.slice(0, 4);

  return (
    <section ref={ref} className="py-20 md:py-28 featured-mentors-background">
      <div className="container-main">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2
              className={`text-balance mb-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            >
              Top-rated mentors
            </h2>
            <p
              className={`text-muted-foreground text-lg max-w-lg transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            >
              Learn from verified experts with thousands of successful sessions
            </p>
          </div>
          <Link
            to="/mentors"
            className={`hidden md:flex items-center gap-1.5 text-sm font-medium text-primary hover:underline transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            View all mentors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !featured.length ? (
          <div className="rounded-3xl border bg-card/80 p-10 text-center shadow-card">
            <h3 className="text-xl font-semibold mb-3">Mentor profiles are on the way</h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Explore the full mentor directory to discover experts across skills, domains, and learning goals.
            </p>
            <Link
              to="/mentors"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Explore mentors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((mentor: any, i: number) => (
              <MentorCard key={mentor.id} mentor={mentor} index={i} isVisible={isVisible} />
            ))}
          </div>
        )}

        <Link
          to="/mentors"
          className="md:hidden flex items-center justify-center gap-1.5 mt-8 text-sm font-medium text-primary"
        >
          View all mentors <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedMentors;
