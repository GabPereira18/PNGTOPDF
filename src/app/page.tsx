
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Download, Mail, Loader2, AlertCircle, UploadCloud, RefreshCw, PencilLine, CheckCircle, ChevronLeft, ChevronRight, Images, ImageOff, ListOrdered, Pencil } from "lucide-react";
import { generatePdfFromImages } from '@/lib/pdf-utils';
import { ImagePreviewItem } from '@/components/ImagePreviewItem';

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

type AppStep = 'select_images' | 'review_images' | 'name_pdf_step' | 'actions';

interface ToastInfo {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  className?: string;
}

export default function Pic2PdfPage() {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfNameError, setPdfNameError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [currentStep, setCurrentStep] = useState<AppStep>('select_images');
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);

  useEffect(() => {
    if (currentStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (toastInfo) {
      toast({
        title: toastInfo.title,
        description: toastInfo.description,
        variant: toastInfo.variant,
        className: toastInfo.className,
      });
      setToastInfo(null); // Reset after showing
    }
  }, [toastInfo, toast]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading || isSendingEmail) return;
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImages: SelectedImage[] = [];
      let imageAddedCount = 0;

      files.forEach(file => {
        if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
          setToastInfo({
            variant: "destructive",
            title: "Tipo de Arquivo Inválido",
            description: `${file.name} não é JPG/PNG e foi ignorado.`,
          });
          return;
        }
        if (selectedImages.some(img => img.file.name === file.name && img.file.size === file.size)) {
          setToastInfo({
            title: "Imagem Duplicada Ignorada",
            description: `${file.name} já está selecionada.`,
            variant: "default"
          });
          return;
        }
        newImages.push({
          id: crypto.randomUUID(),
          file: file,
          previewUrl: URL.createObjectURL(file),
        });
        imageAddedCount++;
      });

      if (newImages.length > 0) {
        setSelectedImages(prev => [...prev, ...newImages]);
        if (imageAddedCount > 0) {
          setToastInfo({
              title: "Imagens Selecionadas",
              description: `${imageAddedCount} nova(s) imagem(ns) adicionada(s).`,
          });
        }
      }
      if (currentStep === 'select_images' && (selectedImages.length + newImages.length > 0)) {
        setCurrentStep('review_images');
      }
      if(fileInputRef.current) fileInputRef.current.value = "";

      if (pdfBlob) {
        setPdfBlob(null);
        if (currentStep === 'actions') setCurrentStep('name_pdf_step');
      }
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    if (isLoading || isSendingEmail) return;
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      const updatedImages = prev.filter(img => img.id !== id);
      if (updatedImages.length === 0) {
        setPdfBlob(null);
        setCurrentStep('select_images');
      } else if (pdfBlob) {
          setPdfBlob(null);
          if(currentStep === 'actions') setCurrentStep('name_pdf_step');
      }
      return updatedImages;
    });
    setToastInfo({
        title: "Imagem Removida",
        description: "A imagem selecionada foi removida.",
    });
  }, [isLoading, isSendingEmail, pdfBlob, currentStep]);

  useEffect(() => {
    return () => {
      selectedImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, [selectedImages]);

  const handlePdfNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setPdfName(name);
    if (!name.trim()) {
      setPdfNameError("O nome do PDF não pode estar vazio.");
    } else if (name.length > 100) {
      setPdfNameError("O nome do PDF é muito longo (máx. 100 caracteres).");
    } else if (/[/\\]/.test(name)) {
      setPdfNameError("O nome do PDF não pode conter barras (/, \\).");
    }
    else {
      setPdfNameError("");
    }
    if (pdfBlob) {
        setPdfBlob(null);
        if(currentStep === 'actions') setCurrentStep('name_pdf_step');
    }
  };

  const validatePdfName = () => {
    if (!pdfName.trim()) {
      setPdfNameError("O nome do PDF não pode estar vazio."); return false;
    }
    if (pdfName.length > 100) {
      setPdfNameError("O nome do PDF é muito longo (máx. 100 caracteres)."); return false;
    }
    if (/[/\\]/.test(pdfName)) {
      setPdfNameError("O nome do PDF não pode conter barras (/, \\)."); return false;
    }
    setPdfNameError("");
    return true;
  }

  const handleCreatePdf = async () => {
    if (!validatePdfName()) {
        setToastInfo({ variant: "destructive", title: "Nome do PDF Inválido", description: pdfNameError });
        return;
    }
    if (selectedImages.length === 0) {
      setToastInfo({ variant: "destructive", title: "Nenhuma Imagem Selecionada", description: "Por favor, selecione imagens para converter." });
      return;
    }

    setIsLoading(true);
    setPdfBlob(null);

    try {
      const finalPdfName = pdfName.trim() || "documento";
      const blob = await generatePdfFromImages(selectedImages, finalPdfName);
      setPdfBlob(blob);
      setToastInfo({
        title: "PDF Gerado com Sucesso!",
        description: `${finalPdfName}.pdf foi criado.`,
        className: "bg-accent text-accent-foreground border-accent-foreground/50",
      });
      setCurrentStep('actions');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setToastInfo({
        variant: "destructive",
        title: "Falha na Geração do PDF",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido. Verifique o console.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `${pdfName.trim() || "documento"}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        // URL.revokeObjectURL(url); // Não revogar imediatamente se a nova guia precisar
      }, 100);
    }
  };

  const handlePreviewPdf = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    }
  };

  const openEmailDialog = () => {
    if (pdfBlob) {
      const finalPdfName = pdfName.trim() || "documento";
      setEmailSubject(`[PDF] ${finalPdfName}`);
      setEmailBody(`Segue o PDF "${finalPdfName}.pdf" anexo.`);
      setEmailTo("");
      setIsEmailDialogOpen(true);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Falha ao converter Blob para Base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleActualEmailSend = async () => {
    if (!pdfBlob || !emailTo) {
      setToastInfo({ variant: "destructive", title: "Dados Incompletos", description: "Por favor, preencha o destinatário." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
        setToastInfo({ variant: "destructive", title: "E-mail Inválido", description: "Por favor, insira um endereço de e-mail válido." });
        return;
    }

    setIsSendingEmail(true);
    try {
      const pdfBase64 = await blobToBase64(pdfBlob);
      const finalPdfName = pdfName.trim() || "documento";

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          pdfData: pdfBase64,
          pdfFileName: `${finalPdfName}.pdf`,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Falha ao enviar e-mail: ${response.statusText}`);
      }

      setToastInfo({
        title: "E-mail Enviado com Sucesso!",
        description: `O PDF foi enviado para ${emailTo}.`,
        className: "bg-accent text-accent-foreground border-accent-foreground/50",
      });
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      setToastInfo({
        variant: "destructive",
        title: "Falha no Envio do E-mail",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRestart = () => {
    setSelectedImages([]);
    setPdfName("");
    setPdfNameError("");
    setIsLoading(false);
    setIsSendingEmail(false);
    setPdfBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
    setIsEmailDialogOpen(false);
    setCurrentStep('select_images');
    setToastInfo({
      title: "Reiniciado",
      description: "O aplicativo foi redefinido. Você pode começar de novo.",
    });
  };

  const canProceedToNamePdf = selectedImages.length > 0;
  const canProceedToCreatePdf = pdfName.trim() !== "" && !pdfNameError && selectedImages.length > 0;


  const handleMoveImage = useCallback((imageId: string, direction: 'up' | 'down') => {
    if (isLoading || isSendingEmail) return;
    setSelectedImages(prevImages => {
      const currentIndex = prevImages.findIndex(img => img.id === imageId);
      if (currentIndex === -1) return prevImages;

      const newOrder = [...prevImages];
      let targetIndex: number;

      if (direction === 'up') {
        if (currentIndex === 0) return prevImages;
        targetIndex = currentIndex - 1;
      } else {
        if (currentIndex === newOrder.length - 1) return prevImages;
        targetIndex = currentIndex + 1;
      }

      [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

      if (pdfBlob) {
        setPdfBlob(null);
        if(currentStep === 'actions') setCurrentStep('name_pdf_step');
      }
      setToastInfo({ title: "Ordem das Imagens Atualizada", description: "A nova ordem será usada para o PDF." });
      return newOrder;
    });
  }, [isLoading, isSendingEmail, pdfBlob, currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select_images':
        return (
          <Card className="w-full max-w-xl shadow-xl rounded-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <UploadCloud className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> 1. Selecionar Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="file" ref={fileInputRef} multiple accept="image/jpeg, image/png" onChange={handleImageSelect} className="hidden" disabled={isLoading || isSendingEmail} />
              <Button onClick={() => fileInputRef.current?.click()} className="w-full py-3 sm:py-4 rounded-lg shadow-md" disabled={isLoading || isSendingEmail}>
                  Selecionar Prints
              </Button>
              {selectedImages.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">
                      <ImageOff className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" />
                      <p className="text-sm">Nenhuma imagem selecionada ainda.</p>
                      <p className="text-xs">Clique no botão acima para começar.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        );

      case 'review_images':
        return (
          <Card className="w-full max-w-2xl shadow-xl rounded-xl mb-4">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Images className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Revise e Ordene ({selectedImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh] sm:h-[60vh] w-full rounded-md border p-2 bg-muted/20 mb-4">
                {selectedImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedImages.map((image, index) => (
                        <ImagePreviewItem
                        key={image.id}
                        image={image}
                        index={index}
                        totalImages={selectedImages.length}
                        onRemove={handleRemoveImage}
                        onMove={handleMoveImage}
                        isLoading={isLoading || isSendingEmail}
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <ImageOff className="mx-auto h-10 w-10 mb-2" />
                        <p className="text-xs">Nenhuma imagem para revisar.</p>
                        <p className="text-xs">Selecione ou adicione mais imagens.</p>
                    </div>
                )}
              </ScrollArea>
               <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full py-2 sm:py-3 rounded-lg shadow-md mb-2" disabled={isLoading || isSendingEmail}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Adicionar Mais Imagens
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setSelectedImages([]); setCurrentStep('select_images'); setPdfBlob(null); }} className="w-full sm:w-auto py-2 sm:py-3" disabled={isLoading || isSendingEmail}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Limpar e Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep('name_pdf_step')}
                className="w-full sm:flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2 sm:py-3"
                disabled={!canProceedToNamePdf || isLoading || isSendingEmail}
              >
                Próximo: Nomear PDF <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case 'name_pdf_step':
        return (
          <Card className="w-full max-w-xl shadow-xl rounded-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <PencilLine className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> 2. Nomeie Seu PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Total de imagens selecionadas: {selectedImages.length}</p>
              <Input
                type="text"
                placeholder="Ex: Relatorio_Viagem_Final"
                value={pdfName}
                onChange={handlePdfNameChange}
                className={`p-2 rounded-lg ${pdfNameError ? "border-destructive ring-destructive ring-1 focus-visible:ring-destructive" : "focus-visible:ring-primary"}`}
                disabled={isLoading || isSendingEmail}
                aria-invalid={!!pdfNameError}
                aria-describedby={pdfNameError ? "pdfNameErrorText" : undefined}
              />
              {pdfNameError && <p id="pdfNameErrorText" className="text-xs text-destructive mt-1.5 flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1"/>{pdfNameError}</p>}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('review_images')} className="w-full sm:w-auto py-2 sm:py-3" disabled={isLoading || isSendingEmail}>
                 <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Revisão
              </Button>
              <Button
                onClick={handleCreatePdf}
                className="w-full sm:flex-1 bg-accent text-accent-foreground hover:bg-accent/90 py-2 sm:py-3"
                disabled={!canProceedToCreatePdf || isLoading || isSendingEmail}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Gerar PDF e Ver Opções
              </Button>
            </CardFooter>
          </Card>
        );

      case 'actions':
        if (!pdfBlob) return null;
        return (
          <Card className="w-full max-w-xl shadow-xl rounded-xl">
             <CardHeader className="text-center pb-4">
               <div className="flex justify-center mb-2">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <CardTitle className="text-lg md:text-xl">
                  PDF Criado: {pdfName.trim() || "documento"}.pdf
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => {
                    setPdfBlob(null);
                    setCurrentStep('name_pdf_step');
                  }}
                  disabled={isLoading || isSendingEmail}
                  aria-label="Editar nome do PDF"
                >
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
               <p className="text-xs text-muted-foreground mt-1">Seu PDF está pronto! Escolha uma das ações abaixo.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-3 px-4 md:px-6">
                <Button
                  onClick={openEmailDialog}
                  className="w-full max-w-xs text-base font-semibold py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-shadow"
                  disabled={isSendingEmail}
                >
                  <Mail className="mr-2 h-5 w-5" /> Enviar por E-mail
                </Button>
                 <Button onClick={handleDownloadPdf} variant="outline" className="w-full max-w-xs py-2 sm:py-3 rounded-lg shadow hover:shadow-md" disabled={isSendingEmail}>
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
                <Button onClick={handlePreviewPdf} variant="outline" className="w-full max-w-xs py-2 sm:py-3 rounded-lg shadow hover:shadow-md" disabled={isSendingEmail}>
                  <Eye className="mr-2 h-4 w-4" /> Visualizar PDF
                </Button>
            </CardContent>
            <CardFooter className="mt-4 pt-4 border-t">
                 <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="w-full py-2 sm:py-3 rounded-lg shadow hover:shadow-md border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isLoading || isSendingEmail}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Criar Novo PDF
                </Button>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 min-h-screen flex flex-col">
      <header className="text-center mt-12 sm:mt-16 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight flex items-center justify-center">
          Bença, Pai. <span className="ml-2 text-2xl sm:text-3xl text-white-shadow">🙏</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Converta Prints para PDF e envie por e-mail.</p>
      </header>

      <main className="flex flex-col items-center w-full">
        <div className="w-full flex justify-center">
          {renderStepContent()}
        </div>
      </main>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[480px] w-[90%] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-base md:text-lg"><Mail className="mr-2 h-5 w-5 text-primary"/>Enviar PDF por E-mail</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 px-2 sm:px-0">
            <div className="grid grid-cols-4 items-center gap-x-3 gap-y-1">
              <Label htmlFor="emailTo" className="text-right col-span-1 sm:col-span-1">
                Para:
              </Label>
              <Input
                id="emailTo"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="col-span-3 sm:col-span-3 p-2"
                placeholder="email@exemplo.com"
                disabled={isSendingEmail}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-x-3 gap-y-1">
              <Label htmlFor="emailSubject" className="text-right col-span-1 sm:col-span-1">
                Assunto:
              </Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="col-span-3 sm:col-span-3 p-2"
                disabled={isSendingEmail}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-x-3 gap-y-1">
              <Label htmlFor="emailBody" className="text-right pt-1 col-span-1 sm:col-span-1">
                Corpo:
              </Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="col-span-3 sm:col-span-3 min-h-[70px] p-2"
                disabled={isSendingEmail}
              />
            </div>
          </div>
          <DialogFooter className="px-2 sm:px-0 pb-2 sm:pb-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSendingEmail} size="sm" className="px-3 py-1.5">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleActualEmailSend} disabled={isSendingEmail || !emailTo.trim()} size="sm" className="px-3 py-1.5">
              {isSendingEmail ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center py-4 mt-8">
        <p className="text-xs text-muted-foreground">
          Desenvolvido por Gabriel Pereira © 2025.
          <br />
          Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

    