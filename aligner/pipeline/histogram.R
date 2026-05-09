suppressMessages(library(ggplot2))
suppressMessages(library(jsonlite))

nucleotides <- c("A","T","G","C")
lengths     <- sample(20:80, 50, replace=TRUE)
sequences   <- sapply(lengths, function(l)
                  paste(sample(nucleotides, l, replace=TRUE), collapse=""))

df <- data.frame(
  id       = paste0("seq", seq_along(lengths)),
  length   = lengths,
  sequence = sequences,
  stringsAsFactors = FALSE
)

svg_path <- tempfile(fileext=".svg")
on.exit(unlink(svg_path))

p <- ggplot(df, aes(x=length)) +
     geom_histogram(binwidth=5, fill="steelblue", color="white") +
     labs(title="Sequence Length Distribution", x="Length (bp)", y="Count") +
     theme_minimal()
svg(svg_path, width=6, height=4)
print(p)
invisible(dev.off())

svg_content <- readChar(svg_path, file.info(svg_path)$size)

cat(toJSON(list(
  sequences = df,
  plot_svg  = svg_content
), auto_unbox=TRUE, dataframe="rows"))
