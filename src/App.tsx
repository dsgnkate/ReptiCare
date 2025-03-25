import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Utensils, Bath, Stethoscope, TableIcon as Toilet, Plus, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "./lib/utils";

// Типы данных
type EntryType = "feeding" | "toilet" | "bath" | "vet";

interface Entry {
  id: string;
  reptileId: string;
  type: EntryType;
  timestamp: string;
  notes?: string;
}

interface Reptile {
  id: string;
  name: string;
}

// Функция для получения иконки по типу записи
const getEntryIcon = (type: EntryType) => {
  switch (type) {
    case "feeding":
      return <Utensils className="h-5 w-5" />;
    case "toilet":
      return <Toilet className="h-5 w-5" />;
    case "bath":
      return <Bath className="h-5 w-5" />;
    case "vet":
      return <Stethoscope className="h-5 w-5" />;
  }
};

// Функция для получения названия типа записи
const getEntryTypeName = (type: EntryType): string => {
  switch (type) {
    case "feeding":
      return "Кормление";
    case "toilet":
      return "Туалет";
    case "bath":
      return "Купание";
    case "vet":
      return "Визит к ветеринару";
  }
};

function App() {
  const [reptiles, setReptiles] = useState<Reptile[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedReptileId, setSelectedReptileId] = useState<string | null>(null);
  const [newReptileName, setNewReptileName] = useState("");
  const [newEntryType, setNewEntryType] = useState<EntryType>("feeding");
  const [newEntryNotes, setNewEntryNotes] = useState("");
  const [isAddReptileDialogOpen, setIsAddReptileDialogOpen] = useState(false);
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const savedReptiles = localStorage.getItem("reptiles");
    const savedEntries = localStorage.getItem("entries");

    if (savedReptiles) {
      const parsedReptiles = JSON.parse(savedReptiles);
      setReptiles(parsedReptiles);
      
      // Выбираем первую рептилию по умолчанию, если она есть
      if (parsedReptiles.length > 0 && !selectedReptileId) {
        setSelectedReptileId(parsedReptiles[0].id);
      }
    }

    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("reptiles", JSON.stringify(reptiles));
  }, [reptiles]);

  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  // Добавление новой рептилии
  const handleAddReptile = () => {
    if (newReptileName.trim()) {
      const newReptile: Reptile = {
        id: Date.now().toString(),
        name: newReptileName.trim(),
      };
      
      const updatedReptiles = [...reptiles, newReptile];
      setReptiles(updatedReptiles);
      setNewReptileName("");
      setIsAddReptileDialogOpen(false);
      
      // Если это первая рептилия, выбираем её
      if (updatedReptiles.length === 1) {
        setSelectedReptileId(newReptile.id);
      }
    }
  };

  // Добавление новой записи
  const handleAddEntry = () => {
    if (selectedReptileId) {
      const newEntry: Entry = {
        id: Date.now().toString(),
        reptileId: selectedReptileId,
        type: newEntryType,
        timestamp: new Date().toISOString(),
        notes: newEntryNotes.trim() || undefined,
      };
      
      setEntries([...entries, newEntry]);
      setNewEntryType("feeding");
      setNewEntryNotes("");
      setIsAddEntryDialogOpen(false);
    }
  };

  // Фильтрация записей для выбранной рептилии
  const filteredEntries = entries.filter(
    (entry) => entry.reptileId === selectedReptileId
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Расчет статистики
  const calculateStats = () => {
    if (!selectedReptileId) return null;

    const reptileEntries = entries.filter(
      (entry) => entry.reptileId === selectedReptileId
    );
    
    if (reptileEntries.length === 0) return null;

    const totalEntries = reptileEntries.length;
    
    // Находим последнюю активность
    const sortedEntries = [...reptileEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastActivity = sortedEntries[0].timestamp;
    
    // Статистика по типам
    const typeStats = {
      feeding: {
        count: 0,
        last: null as string | null,
      },
      toilet: {
        count: 0,
        last: null as string | null,
      },
      bath: {
        count: 0,
        last: null as string | null,
      },
      vet: {
        count: 0,
        last: null as string | null,
      },
    };
    
    // Заполняем статистику по типам
    reptileEntries.forEach((entry) => {
      typeStats[entry.type].count += 1;
      
      const currentLast = typeStats[entry.type].last;
      if (!currentLast || new Date(entry.timestamp) > new Date(currentLast)) {
        typeStats[entry.type].last = entry.timestamp;
      }
    });
    
    return {
      totalEntries,
      lastActivity,
      typeStats,
    };
  };

  const stats = calculateStats();

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy, HH:mm", { locale: ru });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">ReptiCare</h1>
        <p className="text-muted-foreground">
          Приложение для ухода за вашими рептилиями
        </p>
      </header>

      {/* Выбор рептилии */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-auto flex-1">
          <Select
            value={selectedReptileId || ""}
            onValueChange={(value) => setSelectedReptileId(value)}
            disabled={reptiles.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите рептилию" />
            </SelectTrigger>
            <SelectContent>
              {reptiles.map((reptile) => (
                <SelectItem key={reptile.id} value={reptile.id}>
                  {reptile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddReptileDialogOpen} onOpenChange={setIsAddReptileDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Добавить рептилию
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новую рептилию</DialogTitle>
              <DialogDescription>
                Введите имя вашей рептилии.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Имя
                </Label>
                <Input
                  id="name"
                  value={newReptileName}
                  onChange={(e) => setNewReptileName(e.target.value)}
                  className="col-span-3"
                  placeholder="Например: Спайки"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddReptile}>Добавить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedReptileId ? (
        <>
          {/* Статистика */}
          {stats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
                <CardDescription>
                  Общая информация о записях для{" "}
                  {reptiles.find((r) => r.id === selectedReptileId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Всего записей</div>
                    <div className="text-2xl font-bold">{stats.totalEntries}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Последняя активность</div>
                    <div className="text-lg">{formatDate(stats.lastActivity)}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(["feeding", "toilet", "bath", "vet"] as EntryType[]).map((type) => (
                    <div key={type} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                        {getEntryIcon(type)}
                      </div>
                      <div>
                        <div className="font-medium">{getEntryTypeName(type)}</div>
                        <div className="text-sm text-muted-foreground">
                          Всего: {stats.typeStats[type].count}
                        </div>
                        {stats.typeStats[type].last && (
                          <div className="text-sm text-muted-foreground">
                            Последнее: {formatDate(stats.typeStats[type].last)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Кнопка добавления записи */}
          <div className="mb-6">
            <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить запись
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить новую запись</DialogTitle>
                  <DialogDescription>
                    Выберите тип записи и добавьте заметки при необходимости.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entry-type" className="text-right">
                      Тип
                    </Label>
                    <Select
                      value={newEntryType}
                      onValueChange={(value) => setNewEntryType(value as EntryType)}
                    >
                      <SelectTrigger id="entry-type" className="col-span-3">
                        <SelectValue placeholder="Выберите тип записи" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feeding">Кормление</SelectItem>
                        <SelectItem value="toilet">Туалет</SelectItem>
                        <SelectItem value="bath">Купание</SelectItem>
                        <SelectItem value="vet">Визит к ветеринару</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Заметки
                    </Label>
                    <Input
                      id="notes"
                      value={newEntryNotes}
                      onChange={(e) => setNewEntryNotes(e.target.value)}
                      className="col-span-3"
                      placeholder="Необязательно"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddEntry}>Добавить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Список записей */}
          <div>
            <h2 className="text-xl font-bold mb-4">История записей</h2>
            {filteredEntries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            {getEntryIcon(entry.type)}
                          </div>
                          <CardTitle className="text-lg">{getEntryTypeName(entry.type)}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">
                        {formatDate(entry.timestamp)}
                      </div>
                      {entry.notes && <p className="text-sm">{entry.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">
                  Нет записей. Добавьте первую запись, нажав кнопку "Добавить запись".
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <h2 className="text-xl font-bold mb-2">Добро пожаловать в ReptiCare!</h2>
          <p className="text-muted-foreground mb-6">
            Чтобы начать, добавьте вашу первую рептилию, нажав кнопку "Добавить рептилию".
          </p>
          <Button onClick={() => setIsAddReptileDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Добавить рептилию
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;
