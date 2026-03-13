import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../card'

interface Project {
  name: string
  description: string
  url?: string
  image?: string
}

interface ProjectShowcaseProps {
  projects: Project[]
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  if (!projects?.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {projects.map((p, i) => (
        <Card key={i} className="overflow-hidden transition-all duration-200 hover:border-primary/40">
          {p.image && (
            <div className="aspect-video overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-base">{p.name}</CardTitle>
            <CardDescription>{p.description}</CardDescription>
          </CardHeader>
          {p.url && (
            <CardFooter>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View Project
              </a>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
