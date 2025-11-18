import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  Users, 
  Heart, 
  Star,
  ChefHat,
  Flame,
  Bookmark,
  Share2,
  Play
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";

interface Recipe {
  id: string;
  title: string;
  description: string;
  image?: string;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  calories: number;
  rating: number;
  reviews: number;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  isBookmarked?: boolean;
}

interface MobileRecipeCardProps {
  recipe: Recipe;
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function MobileRecipeCard({ 
  recipe, 
  onLike, 
  onBookmark, 
  onShare, 
  onClick 
}: MobileRecipeCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AnimatedCard className="overflow-hidden relative">
      {/* Recipe Image */}
      <div 
        className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100 cursor-pointer"
        onClick={() => onClick?.(recipe.id)}
      >
        {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-orange-300" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(recipe.id);
            }}
          >
            <Bookmark 
              className={`w-4 h-4 ${recipe.isBookmarked ? 'text-blue-600 fill-current' : 'text-gray-600'}`} 
            />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(recipe.id);
            }}
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-gray-800 ml-1" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Recipe Header */}
        <div className="mb-3">
          <h3 
            className="font-bold text-lg text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onClick?.(recipe.id)}
          >
            {recipe.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {recipe.description}
          </p>
        </div>

        {/* Recipe Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookTime}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{recipe.calories}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-medium">{recipe.rating}</span>
            <span className="text-gray-400">({recipe.reviews})</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {recipe.tags.length > 3 && (
            <Badge variant="outline" className="text-xs text-gray-500">
              +{recipe.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Author & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={recipe.author.avatar} />
              <AvatarFallback className="text-xs">
                {recipe.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-700">{recipe.author.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(recipe.id);
              }}
            >
              <Heart className="w-4 h-4 text-red-500" />
            </Button>
            
            <AnimatedButton
              size="sm"
              className="px-4"
              onClick={() => onClick?.(recipe.id)}
            >
              Cook Now
            </AnimatedButton>
          </div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}

interface MobileRecipeListProps {
  recipes: Recipe[];
  onRecipeClick?: (id: string) => void;
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function MobileRecipeList({ 
  recipes, 
  onRecipeClick, 
  onLike, 
  onBookmark, 
  onShare 
}: MobileRecipeListProps) {
  return (
    <div className="space-y-4 pb-20">
      {recipes.map((recipe) => (
        <MobileRecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={onRecipeClick}
          onLike={onLike}
          onBookmark={onBookmark}
          onShare={onShare}
        />
      ))}
    </div>
  );
}