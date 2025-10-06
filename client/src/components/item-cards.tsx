import { ExternalLink, Heart, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuctionItem } from "@shared/schema";

interface ItemCardsProps {
  items: AuctionItem[];
}

export default function ItemCards({ items }: ItemCardsProps) {
  const getConditionVariant = (condition: string) => {
    switch (condition) {
      case "Brand New":
        return "default";
      case "New/Like New":
        return "secondary";
      case "Good Condition":
        return "outline";
      case "As Is":
        return "destructive";
      default:
        return "outline";
    }
  };

  const calculateDiscount = (currentPrice: string, msrp: string) => {
    const current = parseFloat(currentPrice);
    const original = parseFloat(msrp);
    return Math.round(((original - current) / original) * 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4" data-testid="item-cards">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`item-card-${item.id}`}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-md border flex-shrink-0"
                data-testid={`item-card-image-${item.id}`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2" data-testid={`item-card-title-${item.id}`}>
                  {item.title}
                </h3>
                <Badge variant={getConditionVariant(item.condition)} className="mb-2" data-testid={`item-card-condition-${item.id}`}>
                  {item.condition}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <MapPin className="mr-1 h-3 w-3" />
                  <span data-testid={`item-card-location-${item.id}`}>{item.location}, {item.state}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  <span data-testid={`item-card-end-date-${item.id}`}>Ends {formatDate(item.endDate)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-primary" data-testid={`item-card-price-${item.id}`}>
                  ${parseFloat(item.currentPrice).toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground line-through" data-testid={`item-card-msrp-${item.id}`}>
                    ${parseFloat(item.msrp).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-accent" data-testid={`item-card-discount-${item.id}`}>
                    {calculateDiscount(item.currentPrice, item.msrp)}% off
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  data-testid={`button-card-amazon-${item.id}`}
                >
                  <a
                    href={item.amazonSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`button-card-watchlist-${item.id}`}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
