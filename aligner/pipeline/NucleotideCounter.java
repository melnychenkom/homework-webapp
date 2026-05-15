public class NucleotideCounter {
    public static void main(String[] args) {
        String seq = args[0].toUpperCase();
        int a = 0, c = 0, g = 0, t = 0;
        for (char ch : seq.toCharArray()) {
            if      (ch == 'A') a++;
            else if (ch == 'C') c++;
            else if (ch == 'G') g++;
            else if (ch == 'T') t++;
        }
        System.out.printf("{\"A\":%d,\"C\":%d,\"G\":%d,\"T\":%d}%n", a, c, g, t);
    }
}
