
"use client";

import type { SelectedImage } from '@/app/page';
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeftCircle, ArrowRightCircle, ZoomIn } from "lucide-react";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ImagePreviewItemProps {
  image: SelectedImage;
  index: number;
  totalImages: number;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  isLoading?: boolean;
}

export function ImagePreviewItem({
  image,
  index,
  totalImages,
  onRemove,
  onMove,
  isLoading,
}: ImagePreviewItemProps) {

  const handleMoveUp = () => {
    if (!isLoading) {
      onMove(image.id, 'up');
    }
  };

  const handleMoveDown = () => {
    if (!isLoading) {
      onMove(image.id, 'down');
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col shadow-md rounded-lg overflow-hidden transition-all duration-300 w-full", // w-full para ocupar a coluna do grid
        isLoading && "opacity-60 cursor-default"
      )}
      aria-label={`Imagem ${image.file.name}, ${isLoading ? 'processando' : 'reordenável'}`}
    >
      <div className="relative aspect-video w-full overflow-hidden group"> {/* Alterado para aspect-video ou similar */}
        <img
          src={image.previewUrl}
          alt={`Prévia de ${image.file.name}`}
          className="object-contain w-full h-full" // object-contain para ver a imagem inteira
        />
        <div className="absolute top-2 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow"
            onClick={() => { if (!isLoading) onRemove(image.id); }}
            disabled={isLoading}
            aria-label={`Remover ${image.file.name}`}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow"
                disabled={isLoading}
                aria-label={`Ampliar ${image.file.name}`}
              >
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:p-4 flex items-center justify-center">
              <img src={image.previewUrl} alt={`Prévia ampliada de ${image.file.name}`} className="max-w-full max-h-[85vh] object-contain rounded-md"/>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <CardContent className="p-2 sm:p-3 flex-grow flex flex-col justify-center">
        <p className="text-xs sm:text-sm text-muted-foreground text-center truncate" title={image.file.name}>
          {image.file.name}
        </p>
      </CardContent>
      
      <CardFooter className="p-1.5 sm:p-2 border-t bg-muted/30 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMoveUp}
          disabled={isLoading || index === 0}
          aria-label="Mover imagem para a posição anterior"
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <ArrowLeftCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
          {index + 1} / {totalImages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMoveDown}
          disabled={isLoading || index === totalImages - 1}
          aria-label="Mover imagem para a próxima posição"
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <ArrowRightCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
