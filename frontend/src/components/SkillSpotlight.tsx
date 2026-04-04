import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useSkillsByCategory } from '@/hooks/useApi';

const fallbackCategories = [
  {
    id: 'frontend-development',
    name: 'Frontend Development',
    skills: [
      { id: 'react', name: 'React', _count: { mentors: 0 } },
      { id: 'typescript', name: 'TypeScript', _count: { mentors: 0 } },
      { id: 'next-js', name: 'Next.js', _count: { mentors: 0 } },
    ],
  },
  {
    id: 'data-ai',
    name: 'Data & AI',
    skills: [
      { id: 'python', name: 'Python', _count: { mentors: 0 } },
      { id: 'machine-learning', name: 'Machine Learning', _count: { mentors: 0 } },
      { id: 'sql', name: 'SQL', _count: { mentors: 0 } },
    ],
  },
  {
    id: 'design-creative',
    name: 'Design & Creative',
    skills: [
      { id: 'ui-ux-design', name: 'UI/UX Design', _count: { mentors: 0 } },
      { id: 'figma', name: 'Figma', _count: { mentors: 0 } },
      { id: 'graphic-design', name: 'Graphic Design', _count: { mentors: 0 } },
    ],
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    skills: [
      { id: 'aws', name: 'AWS', _count: { mentors: 0 } },
      { id: 'docker', name: 'Docker', _count: { mentors: 0 } },
      { id: 'kubernetes', name: 'Kubernetes', _count: { mentors: 0 } },
    ],
  },
];

const SkillSpotlight = () => {
  const { data: categories = [], isLoading } = useSkillsByCategory();
  const sourceCategories = categories.length ? categories : fallbackCategories;
  const featuredCategories = sourceCategories.filter((category: any) => category.skills?.length);
  const previewCategories = featuredCategories.slice(0, 8);

  return (
    <section className="py-20 md:py-28 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--secondary)/0.45))]">
      <div className="container-main">
        <div className={`rounded-[2rem] border border-primary/10 bg-card/80 backdrop-blur-sm shadow-card overflow-hidden ${isLoading ? 'animate-pulse' : ''}`}>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0">
            <div className="p-8 md:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/70">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Skill Atlas
              </div>
              <h2 className="text-balance mb-4 max-w-2xl">
                Explore the skills you can start learning today
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Browse in-demand learning tracks, discover high-value skills, and quickly find the right mentor to help you move forward with confidence.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-8">
                <div className="rounded-2xl bg-background border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">Categories</p>
                  <p className="text-sm font-semibold leading-snug">Explore curated learning paths across the most valuable domains on the platform.</p>
                </div>
                <div className="rounded-2xl bg-background border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">Skills</p>
                  <p className="text-sm font-semibold leading-snug">Discover practical skills that can help you grow faster with the right mentor by your side.</p>
                </div>
                <div className="rounded-2xl bg-background border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">Discovery</p>
                  <p className="text-sm font-semibold leading-snug">Explore the skills you can start learning today and find the mentor who can help you move forward with confidence.</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 lg:p-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2">Explore by category</p>
                  <h3 className="text-2xl font-semibold">Choose a learning path that fits your goals</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {previewCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    to={`/mentors?category=${category.id}`}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground">{category.skills.length}</span>
                  </Link>
                ))}
              </div>

              <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-8">
                Explore mentors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mt-8">
          {previewCategories.map((category: any) => (
            <div
              key={category.id}
              className={`rounded-[1.75rem] border bg-card/95 p-6 shadow-card hover:shadow-card-hover transition-shadow ${isLoading ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-primary/80 mb-2">{category.name}</p>
                  <h3 className="text-xl font-semibold">{category.skills.length} skills to explore</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Explore focused skills in this area and connect with mentors who can guide your next step.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-6">
                {category.skills.map((skill: any) => (
                  <Link
                    key={skill.id}
                    to={`/mentors?skill=${encodeURIComponent(skill.name)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/55 px-4 py-2 text-sm text-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary transition-colors"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                      {skill._count?.mentors || 0} mentor{(skill._count?.mentors || 0) === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>

              <Link to={`/mentors?category=${category.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Browse {category.name} mentors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            to="/mentors"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            View More Skills
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Loading the latest categories and skills for you.
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default SkillSpotlight;
