# Data Patterns

## Table of Contents
1. [Data Tables](#data-tables)
2. [Stats Cards](#stats-cards)
3. [Forms](#forms)
4. [Filters](#filters)

## Data Tables

```tsx
<Card className="border-slate-200/50 shadow-luxury dark:border-slate-800/50">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
    <div>
      <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
      <CardDescription className="text-sm text-slate-500">
        Manage and track customer orders
      </CardDescription>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
        <Filter className="h-3.5 w-3.5" /> Filter
      </Button>
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
      <Button size="sm" className="h-8 gap-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" /> Add Order
      </Button>
    </div>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow className="border-slate-100 bg-slate-50/50 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
          <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-slate-500">
            Order
          </TableHead>
          <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Customer
          </TableHead>
          <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Status
          </TableHead>
          <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow 
            key={order.id} 
            className="group cursor-pointer border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
          >
            <TableCell className="pl-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">#{order.id}</p>
                  <p className="text-xs text-slate-500">{order.date}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={order.customer.avatar} />
                  <AvatarFallback className="text-[10px]">{order.customer.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700 dark:text-slate-300">{order.customer.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant="secondary" 
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                  order.status === 'completed' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  order.status === 'pending' && "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  order.status === 'cancelled' && "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                )}
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="pr-6 text-right">
              <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                ${order.amount.toLocaleString()}
              </span>
            </TableCell>
            <TableCell className="w-12 pr-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
  
  {/* Pagination */}
  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
    <p className="text-sm text-slate-500">Showing 1-10 of 100 results</p>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled>Previous</Button>
      <Button variant="outline" size="sm">Next</Button>
    </div>
  </div>
</Card>
```

## Stats Cards

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {stats.map((stat) => (
    <Card 
      key={stat.label}
      className="group relative overflow-hidden border-slate-200/50 shadow-luxury transition-all hover:shadow-luxury-lg dark:border-slate-800/50"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <div className="flex items-center gap-1.5">
              {stat.trend > 0 ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">+{stat.trend}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{stat.trend}%</span>
                </div>
              )}
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-200 dark:bg-slate-800">
            <stat.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-slate-100 to-transparent opacity-50 dark:from-slate-800" />
      </CardContent>
    </Card>
  ))}
</div>
```

## Forms

```tsx
<Card className="max-w-2xl border-slate-200/50 shadow-luxury dark:border-slate-800/50">
  <CardHeader>
    <CardTitle className="text-xl font-semibold">Create New Item</CardTitle>
    <CardDescription>Add a new item to your inventory</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Text input */}
    <div className="space-y-2">
      <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Name
      </Label>
      <Input 
        id="name"
        placeholder="Enter name"
        className="h-11 border-slate-200 bg-white px-4 text-base shadow-sm transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-800 dark:bg-slate-950"
      />
    </div>
    
    {/* Select */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</Label>
      <Select>
        <SelectTrigger className="h-11 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    {/* Textarea with character count */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
        <span className="text-xs text-slate-400">{charCount}/500</span>
      </div>
      <Textarea 
        placeholder="Enter description..."
        className="min-h-[120px] resize-none border-slate-200 bg-white shadow-sm placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950"
        onChange={(e) => setCharCount(e.target.value.length)}
      />
    </div>
    
    {/* File upload */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Images</Label>
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="text-center">
          <Upload className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </div>
  </CardContent>
  <CardFooter className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/30">
    <Button variant="outline">Cancel</Button>
    <Button className="min-w-[120px]">Create</Button>
  </CardFooter>
</Card>
```

## Filters

```tsx
// Filter bar
<div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
  <div className="flex items-center gap-2">
    <Filter className="h-4 w-4 text-slate-400" />
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
  </div>
  
  <Select>
    <SelectTrigger className="h-8 w-[140px] text-xs">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
    </SelectContent>
  </Select>
  
  <Select>
    <SelectTrigger className="h-8 w-[140px] text-xs">
      <SelectValue placeholder="Date Range" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="7d">Last 7 days</SelectItem>
      <SelectItem value="30d">Last 30 days</SelectItem>
      <SelectItem value="90d">Last 90 days</SelectItem>
    </SelectContent>
  </Select>
  
  {/* Active filter badges */}
  <div className="flex items-center gap-2">
    <Badge variant="secondary" className="gap-1 rounded-full pl-2 pr-1">
      Active
      <button className="ml-1 rounded-full p-0.5 hover:bg-slate-200">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  </div>
  
  <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs text-slate-500">
    Clear all
  </Button>
</div>
```
